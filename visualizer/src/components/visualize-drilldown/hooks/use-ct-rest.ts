import { useCallback } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import {
  actions as sdkActions,
  useAsyncDispatch,
} from '@commercetools-frontend/sdk';
import { buildQuery, type QueryParams } from '../utils/ct-rest';

/** Thrown when the application context has no project key (nothing to query). */
export class MissingProjectError extends Error {
  constructor() {
    super('Missing project key');
    this.name = 'MissingProjectError';
  }
}

/**
 * Read-only access to the commercetools REST API through the Merchant Center
 * API proxy. `get('/stores', { limit: '20' })` resolves to the response body.
 */
export const useCtRest = () => {
  const dispatch = useAsyncDispatch();
  const projectKey = useApplicationContext(
    (context) => context.project?.key ?? ''
  );

  const get = useCallback(
    async <T = unknown>(
      endpoint: string,
      params: QueryParams = {}
    ): Promise<T> => {
      if (!projectKey) {
        throw new MissingProjectError();
      }
      const query = buildQuery(params);
      const uri = `/${projectKey}${endpoint}${query ? `?${query}` : ''}`;
      const response = await dispatch(
        sdkActions.get({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri,
        })
      );
      return response as T;
    },
    [dispatch, projectKey]
  );

  return { get, projectKey };
};
