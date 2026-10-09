/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { DOMAINS } from '@commercetools-frontend/constants';
import { useConnector } from '../hooks';
import {
  ChangeEvent,
  LinkData,
  LocationData,
  NodeEntity,
} from '../hooks/types';
import messages from '../messages';
import {
  applyLinkChange,
  applyLocationChange,
  dedupeNodes,
} from './apply-change';

const SAVE_DEBOUNCE_MS = 1000;

type Status = 'loading' | 'error' | 'ready';

interface ChangeContextType {
  trackLinkChange: (change: ChangeEvent) => void;
  trackNodeChange: (change: ChangeEvent) => void;
  linkData: LinkData[];
  nodeData: NodeEntity[];
  status: Status;
  error?: unknown;
  canManage: boolean;
}

const ChangeContext = createContext<ChangeContextType | undefined>(undefined);

export const ChangeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const intl = useIntl();
  const showNotification = useShowNotification();
  const {
    fetchAll,
    saveLinkData,
    saveLocationData,
    linkData,
    locationData,
    isReady,
    loadError,
    canManage,
  } = useConnector();

  const [nodes, setNodes] = useState<NodeEntity[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [fetchError, setFetchError] = useState<unknown>();

  const linksRef = useRef<LinkData[]>([]);
  const locationsRef = useRef<LocationData[]>([]);
  const nodeKeysRef = useRef<string[]>([]);
  const seededRef = useRef(false);

  // Latest values for the stable debounced wrappers below.
  const latest = useRef({
    fetchAll,
    saveLinkData,
    saveLocationData,
    linkData,
    locationData,
  });
  latest.current = {
    fetchAll,
    saveLinkData,
    saveLocationData,
    linkData,
    locationData,
  };
  const notifyRef = useRef<(error: unknown) => void>(() => undefined);
  notifyRef.current = () =>
    showNotification({
      kind: 'error',
      domain: DOMAINS.SIDE,
      text: intl.formatMessage(messages.saveError),
    });

  // Seed local state exactly once. Later Apollo updates (the cache echo of our
  // own saves) are ignored: local state is the source of truth after load.
  useEffect(() => {
    if (!isReady || loadError || seededRef.current) {
      return;
    }
    let cancelled = false;
    latest.current
      .fetchAll()
      .then(({ schemas, productTypes, types }) => {
        if (cancelled) {
          return;
        }
        seededRef.current = true;
        const initialLinks = latest.current.linkData;
        linksRef.current = initialLinks;
        locationsRef.current = latest.current.locationData;
        const allNodes = dedupeNodes([...schemas, ...productTypes, ...types]);
        nodeKeysRef.current = allNodes.map((node) => node.key);
        setLinks(initialLinks);
        setNodes(allNodes);
        setSeeded(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFetchError(error ?? new Error('Unknown error'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, loadError]);

  const debouncedSaveLinks = useMemo(
    () =>
      debounce((list: LinkData[]) => {
        Promise.resolve(latest.current.saveLinkData(list)).catch((e) =>
          notifyRef.current(e)
        );
      }, SAVE_DEBOUNCE_MS),
    []
  );
  const debouncedSaveLocations = useMemo(
    () =>
      debounce((list: LocationData[]) => {
        Promise.resolve(latest.current.saveLocationData(list)).catch((e) =>
          notifyRef.current(e)
        );
      }, SAVE_DEBOUNCE_MS),
    []
  );

  // Send a pending write when the page unmounts.
  useEffect(
    () => () => {
      debouncedSaveLinks.flush();
      debouncedSaveLocations.flush();
    },
    [debouncedSaveLinks, debouncedSaveLocations]
  );

  const trackLinkChange = useCallback(
    (change: ChangeEvent) => {
      const next = applyLinkChange(linksRef.current, change);
      if (next !== linksRef.current) {
        linksRef.current = next;
        setLinks(next);
        debouncedSaveLinks(next);
      }
    },
    [debouncedSaveLinks]
  );

  const trackNodeChange = useCallback(
    (change: ChangeEvent) => {
      const next = applyLocationChange(
        locationsRef.current,
        change,
        nodeKeysRef.current
      );
      if (next !== locationsRef.current) {
        locationsRef.current = next;
        debouncedSaveLocations(next);
      }
    },
    [debouncedSaveLocations]
  );

  const error = loadError ?? fetchError;
  let status: Status = 'loading';
  if (error) {
    status = 'error';
  } else if (seeded) {
    status = 'ready';
  }

  const value = useMemo<ChangeContextType>(
    () => ({
      trackLinkChange,
      trackNodeChange,
      nodeData: nodes,
      linkData: links,
      status,
      error,
      canManage,
    }),
    [trackLinkChange, trackNodeChange, nodes, links, status, error, canManage]
  );

  return (
    <ChangeContext.Provider value={value}>{children}</ChangeContext.Provider>
  );
};

export const useChange = () => {
  const context = useContext(ChangeContext);
  if (context === undefined) {
    throw new Error('useChange must be used within ChangeProvider');
  }
  return context;
};
