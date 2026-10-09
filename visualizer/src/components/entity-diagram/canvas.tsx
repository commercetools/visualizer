/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useIntl } from 'react-intl';
import { Box } from '@commercetools/nimbus';
import { useChange } from './providers/changes';
import { CustomNode } from './custom-node';
import { CustomEdge } from './custom-edge';
import { edgeMapper, generateUUID, nodeMapper } from './utils';
import { useAvailableHeight } from './use-available-height';
import messages from './messages';

const Canvas: React.FC = () => {
  const intl = useIntl();
  const { linkData, trackLinkChange, nodeData, trackNodeChange } = useChange();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { containerRef, height } = useAvailableHeight();

  // Transform GoEntity nodes to ReactFlow nodes
  const initialNodes: Node[] = useMemo(
    () => nodeData.map(nodeMapper),
    [nodeData]
  );

  // Transform LinkData to ReactFlow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      linkData.map((edge) => {
        const edgeData = edgeMapper(edge);
        return {
          ...edgeData,
          data: {
            ...edgeData.data,
            trackLinkChange,
            setIsEditing: setIsEditingLabel,
          },
        };
      }),
    [linkData, trackLinkChange]
  );

  // Only the initial values are used: the provider renders the canvas after load
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  // Handle node position changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          trackNodeChange({
            type: 'nodePositionChanged',
            nodeKey: change.id,
            loc: `${change.position.x} ${change.position.y}`,
          });
        }
      });
    },
    [trackNodeChange, onNodesChange]
  );

  // Handle edge changes (including removal)
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      changes.forEach((change) => {
        if (change.type === 'remove') {
          trackLinkChange({
            type: 'linkRemoved',
            key: change.id,
          });
        }
      });
    },
    [trackLinkChange, onEdgesChange]
  );

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: generateUUID(),
        data: {
          label: '',
          toLabel: '',
          trackLinkChange,
          setIsEditing: setIsEditingLabel,
        },
        type: 'custom',
      };

      setEdges((eds) => addEdge(newEdge, eds));

      trackLinkChange({
        type: 'linkAdded',
        key: newEdge.id,
        fromNode: connection.source,
        toNode: connection.target,
        text: '',
        toText: '',
      });
    },
    [setEdges, trackLinkChange]
  );

  // Custom edge types
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id);
  }, []);

  // Handle background click to clear selection
  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      selectedEdge &&
      !isEditingLabel
    ) {
      const edgeToDelete = edges.find((edge) => edge.id === selectedEdge);
      if (edgeToDelete) {
        // Remove the edge
        setEdges((currentEdges) =>
          currentEdges.filter((edge) => edge.id !== selectedEdge)
        );

        // Track the change
        trackLinkChange({
          type: 'linkRemoved',
          key: selectedEdge,
          fromNode: edgeToDelete.source,
          toNode: edgeToDelete.target,
        });
      }
      setSelectedEdge(null);
    }
  };

  return (
    <Box
      ref={containerRef}
      height={`${height}px`}
      width="100%"
      border="solid-25"
      borderColor="neutral.6"
      bg="bg"
      data-testid="entity-diagram-canvas"
      aria-label={intl.formatMessage(messages.canvasAriaLabel)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onKeyDown={handleKeyDown}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Box>
  );
};

export default Canvas;
