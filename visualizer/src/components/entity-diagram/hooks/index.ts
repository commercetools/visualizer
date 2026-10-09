import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import {
  actions,
  TSdkAction,
  useAsyncDispatch,
} from '@commercetools-frontend/sdk';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useMemo } from 'react';
import {
  useCustomObjectCreatorOrUpdater,
  useCustomObjectFetcher,
  useCustomObjectsFetcher,
} from '../../../hooks';
import { PERMISSIONS } from '../../../constants';
import { buildUrlWithParams } from '../utils';
import {
  mapProductTypeToGoEntities,
  mapSchemaTypeToGoEntities,
  mapTypeToGoEntities,
} from './mapper';
import { fetchAllPages, PAGE_SIZE } from './pagination';
import {
  LinkData,
  LocationData,
  PagedQueryResponse,
  ProductTypeResponse,
  SchemaTypeResponse,
  TypeResponse,
} from './types';

export { fetchAllPages } from './pagination';

const SCHEMA_CONTAINER = 'mc-custom-object-schema';
const LINK_DATA_CONTAINER = 'mc-link-data';
const LINK_DATA_KEY = 'linkDataList';
const LOCATION_DATA_KEY = 'locationDataList';

const asList = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const useConnector = () => {
  const projectKey = useApplicationContext((context) => context.project?.key);
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });

  const {
    customObjects: schemasRaw,
    loading: isSchemasLoading,
    error: schemasError,
  } = useCustomObjectsFetcher({
    container: SCHEMA_CONTAINER,
    limit: 200,
    offset: 0,
  });

  const {
    customObject: linkDataRaw,
    loading: isLinkDataLoading,
    error: linkDataError,
  } = useCustomObjectFetcher({
    container: LINK_DATA_CONTAINER,
    key: LINK_DATA_KEY,
  });

  const {
    customObject: locationDataRaw,
    loading: isLocationDataLoading,
    error: locationDataError,
  } = useCustomObjectFetcher({
    container: LINK_DATA_CONTAINER,
    key: LOCATION_DATA_KEY,
  });

  const schemaResponse = useMemo(
    () =>
      ({
        results: schemasRaw?.results ?? [],
      } as unknown as PagedQueryResponse<SchemaTypeResponse>),
    [schemasRaw]
  );

  const { execute: saveCustomObject } = useCustomObjectCreatorOrUpdater();

  const dispatchProductTypeRead = useAsyncDispatch<
    TSdkAction,
    PagedQueryResponse<ProductTypeResponse>
  >();
  const dispatchTypeRead = useAsyncDispatch<
    TSdkAction,
    PagedQueryResponse<TypeResponse>
  >();

  const fetchPage = <T>(
    dispatch: (action: TSdkAction) => Promise<PagedQueryResponse<T>>,
    resource: 'product-types' | 'types',
    page: number
  ) => {
    const offset = (page - 1) * PAGE_SIZE;
    return dispatch(
      actions.get({
        mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
        uri: buildUrlWithParams(`/${projectKey}/${resource}`, {
          limit: PAGE_SIZE.toString(),
          ...(offset && { offset: offset.toString() }),
        }),
      })
    );
  };

  const fetchAllProductTypes = () =>
    fetchAllPages((page) =>
      fetchPage<ProductTypeResponse>(
        dispatchProductTypeRead,
        'product-types',
        page
      )
    );

  const fetchAllTypes = () =>
    fetchAllPages((page) =>
      fetchPage<TypeResponse>(dispatchTypeRead, 'types', page)
    );

  const saveList = async (key: string, list: LinkData[] | LocationData[]) => {
    if (!canManage) {
      return undefined;
    }
    // The draft value is a JSON *string*; reads come back already parsed.
    return saveCustomObject({
      draft: {
        container: LINK_DATA_CONTAINER,
        key,
        value: JSON.stringify(list),
      },
    });
  };

  const saveLinkData = (linkDataList: LinkData[]) =>
    saveList(LINK_DATA_KEY, linkDataList);

  const saveLocationData = (locationDataList: LocationData[]) =>
    saveList(LOCATION_DATA_KEY, locationDataList);

  const isReady =
    !isSchemasLoading && !isLinkDataLoading && !isLocationDataLoading;
  const loadError = schemasError ?? linkDataError ?? locationDataError;

  const linkData = asList<LinkData>(linkDataRaw?.value);
  const locationData = asList<LocationData>(locationDataRaw?.value);

  // Only call once `isReady` is true.
  const fetchAll = async () => {
    if (!projectKey) {
      return { schemas: [], productTypes: [], types: [] };
    }
    const [productTypes, types] = await Promise.all([
      fetchAllProductTypes().then((result) =>
        mapProductTypeToGoEntities(result, locationData)
      ),
      fetchAllTypes().then((result) =>
        mapTypeToGoEntities(result, locationData)
      ),
    ]);
    const schemas = mapSchemaTypeToGoEntities(schemaResponse, locationData);
    return { schemas, productTypes, types };
  };

  return {
    saveLinkData,
    saveLocationData,
    fetchAll,
    linkData,
    locationData,
    isReady,
    loadError,
    canManage,
  };
};
