/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'VisualizeDrilldown.title',
    defaultMessage: 'Visualize Drilldown',
  },
  description: {
    id: 'VisualizeDrilldown.description',
    defaultMessage:
      'Explore your commercetools data through interactive treemap visualizations. Select an entity type to start exploring relationships between your data.',
  },
  selectEntityTypeTitle: {
    id: 'VisualizeDrilldown.selectEntityTypeTitle',
    defaultMessage: 'Select Entity Type to Visualize',
  },
  selectEntityTypeDescription: {
    id: 'VisualizeDrilldown.selectEntityTypeDescription',
    defaultMessage:
      'Choose an entity type to start exploring your data relationships.',
  },
  searchTitle: {
    id: 'VisualizeDrilldown.searchTitle',
    defaultMessage: 'Search',
  },
  sortByTitle: {
    id: 'VisualizeDrilldown.sortByTitle',
    defaultMessage: 'Sort By',
  },
  currentlySortingBy: {
    id: 'VisualizeDrilldown.currentlySortingBy',
    defaultMessage:
      'Currently sorting by {field}. Click another field to change sort criteria.',
  },
  navigationPath: {
    id: 'VisualizeDrilldown.navigationPath',
    defaultMessage: 'Navigation Path',
  },
  rootBreadcrumb: {
    id: 'VisualizeDrilldown.rootBreadcrumb',
    defaultMessage: 'Root',
  },
  entityInfoTitle: {
    id: 'VisualizeDrilldown.entityInfoTitle',
    defaultMessage: 'Entity Info',
  },
  entityType: {
    id: 'VisualizeDrilldown.entityType',
    defaultMessage: 'Entity Type',
  },
  entityId: {
    id: 'VisualizeDrilldown.entityId',
    defaultMessage: 'ID',
  },
  entityKey: {
    id: 'VisualizeDrilldown.entityKey',
    defaultMessage: 'Key',
  },
  entityVersion: {
    id: 'VisualizeDrilldown.entityVersion',
    defaultMessage: 'Version',
  },
  entityCreatedAt: {
    id: 'VisualizeDrilldown.entityCreatedAt',
    defaultMessage: 'Created At',
  },
  entityLastModified: {
    id: 'VisualizeDrilldown.entityLastModified',
    defaultMessage: 'Last Modified',
  },
  rawData: {
    id: 'VisualizeDrilldown.rawData',
    defaultMessage: 'Raw Data',
  },
  legend: {
    id: 'VisualizeDrilldown.legend',
    defaultMessage: 'Legend:',
  },
  showAll: {
    id: 'VisualizeDrilldown.showAll',
    defaultMessage: 'Show All',
  },
  hideAll: {
    id: 'VisualizeDrilldown.hideAll',
    defaultMessage: 'Hide All',
  },
  loadingEntities: {
    id: 'VisualizeDrilldown.loadingEntities',
    defaultMessage: 'Loading {entityType} data...',
  },
  loadingRelatedEntities: {
    id: 'VisualizeDrilldown.loadingRelatedEntities',
    defaultMessage: 'Loading related entities...',
  },
  errorLoadingEntities: {
    id: 'VisualizeDrilldown.errorLoadingEntities',
    defaultMessage: 'Error loading entities: {error}',
  },
  noDataFound: {
    id: 'VisualizeDrilldown.noDataFound',
    defaultMessage: 'No {entityType} data found.',
  },
  loadMore: {
    id: 'VisualizeDrilldown.loadMore',
    defaultMessage: 'Load More...',
  },
  noEntitiesVisible: {
    id: 'VisualizeDrilldown.noEntitiesVisible',
    defaultMessage: 'No entities visible',
  },
  allEntityTypesHidden: {
    id: 'VisualizeDrilldown.allEntityTypesHidden',
    defaultMessage:
      'All entity types are currently hidden. Use the legend above to show specific entity types.',
  },
  clickToExploreRoot: {
    id: 'VisualizeDrilldown.clickToExploreRoot',
    defaultMessage:
      'Click on any item to explore its relationships and drill down further. Click "..." to load more items.',
  },
  clickToExploreDrilldown: {
    id: 'VisualizeDrilldown.clickToExploreDrilldown',
    defaultMessage:
      'Click on any item to drill down further, click "..." to load more items, or use breadcrumbs to navigate back to previous levels.',
  },
  close: {
    id: 'VisualizeDrilldown.close',
    defaultMessage: 'Close',
  },
  entityDetails: {
    id: 'VisualizeDrilldown.entityDetails',
    defaultMessage: '{entityType} details',
  },
  // Entity type labels (singular and plural, never derived by slicing)
  businessUnitSingular: {
    id: 'VisualizeDrilldown.entityType.business-unit.singular',
    defaultMessage: 'Business Unit',
    description: 'Singular name of a commercetools entity type',
  },
  businessUnitPlural: {
    id: 'VisualizeDrilldown.entityType.business-unit.plural',
    defaultMessage: 'Business Units',
    description: 'Plural name of a commercetools entity type',
  },
  associateSingular: {
    id: 'VisualizeDrilldown.entityType.associate.singular',
    defaultMessage: 'Associate',
    description: 'Singular name of a commercetools entity type',
  },
  associatePlural: {
    id: 'VisualizeDrilldown.entityType.associate.plural',
    defaultMessage: 'Associates',
    description: 'Plural name of a commercetools entity type',
  },
  customerSingular: {
    id: 'VisualizeDrilldown.entityType.customer.singular',
    defaultMessage: 'Customer',
    description: 'Singular name of a commercetools entity type',
  },
  customerPlural: {
    id: 'VisualizeDrilldown.entityType.customer.plural',
    defaultMessage: 'Customers',
    description: 'Plural name of a commercetools entity type',
  },
  storeSingular: {
    id: 'VisualizeDrilldown.entityType.store.singular',
    defaultMessage: 'Store',
    description: 'Singular name of a commercetools entity type',
  },
  storePlural: {
    id: 'VisualizeDrilldown.entityType.store.plural',
    defaultMessage: 'Stores',
    description: 'Plural name of a commercetools entity type',
  },
  channelSingular: {
    id: 'VisualizeDrilldown.entityType.channel.singular',
    defaultMessage: 'Channel',
    description: 'Singular name of a commercetools entity type',
  },
  channelPlural: {
    id: 'VisualizeDrilldown.entityType.channel.plural',
    defaultMessage: 'Channels',
    description: 'Plural name of a commercetools entity type',
  },
  productSingular: {
    id: 'VisualizeDrilldown.entityType.product.singular',
    defaultMessage: 'Product',
    description: 'Singular name of a commercetools entity type',
  },
  productPlural: {
    id: 'VisualizeDrilldown.entityType.product.plural',
    defaultMessage: 'Products',
    description: 'Plural name of a commercetools entity type',
  },
  categorySingular: {
    id: 'VisualizeDrilldown.entityType.category.singular',
    defaultMessage: 'Category',
    description: 'Singular name of a commercetools entity type',
  },
  categoryPlural: {
    id: 'VisualizeDrilldown.entityType.category.plural',
    defaultMessage: 'Categories',
    description: 'Plural name of a commercetools entity type',
  },
  productSelectionSingular: {
    id: 'VisualizeDrilldown.entityType.product-selection.singular',
    defaultMessage: 'Product Selection',
    description: 'Singular name of a commercetools entity type',
  },
  productSelectionPlural: {
    id: 'VisualizeDrilldown.entityType.product-selection.plural',
    defaultMessage: 'Product Selections',
    description: 'Plural name of a commercetools entity type',
  },
  cartDiscountSingular: {
    id: 'VisualizeDrilldown.entityType.cart-discount.singular',
    defaultMessage: 'Cart Discount',
    description: 'Singular name of a commercetools entity type',
  },
  cartDiscountPlural: {
    id: 'VisualizeDrilldown.entityType.cart-discount.plural',
    defaultMessage: 'Cart Discounts',
    description: 'Plural name of a commercetools entity type',
  },
  standalonePriceSingular: {
    id: 'VisualizeDrilldown.entityType.standalone-price.singular',
    defaultMessage: 'Standalone Price',
    description: 'Singular name of a commercetools entity type',
  },
  standalonePricePlural: {
    id: 'VisualizeDrilldown.entityType.standalone-price.plural',
    defaultMessage: 'Standalone Prices',
    description: 'Plural name of a commercetools entity type',
  },
  customerGroupSingular: {
    id: 'VisualizeDrilldown.entityType.customer-group.singular',
    defaultMessage: 'Customer Group',
    description: 'Singular name of a commercetools entity type',
  },
  customerGroupPlural: {
    id: 'VisualizeDrilldown.entityType.customer-group.plural',
    defaultMessage: 'Customer Groups',
    description: 'Plural name of a commercetools entity type',
  },
  // Sort and search field labels
  sortFieldName: {
    id: 'VisualizeDrilldown.sortField.name',
    defaultMessage: 'Name',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldKey: {
    id: 'VisualizeDrilldown.sortField.key',
    defaultMessage: 'Key',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldEmail: {
    id: 'VisualizeDrilldown.sortField.email',
    defaultMessage: 'Email',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldFirstName: {
    id: 'VisualizeDrilldown.sortField.firstName',
    defaultMessage: 'First Name',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldLastName: {
    id: 'VisualizeDrilldown.sortField.lastName',
    defaultMessage: 'Last Name',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldSku: {
    id: 'VisualizeDrilldown.sortField.sku',
    defaultMessage: 'SKU',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldOrderHint: {
    id: 'VisualizeDrilldown.sortField.orderHint',
    defaultMessage: 'Order',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldCreatedAt: {
    id: 'VisualizeDrilldown.sortField.createdAt',
    defaultMessage: 'Created Date',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  sortFieldLastModifiedAt: {
    id: 'VisualizeDrilldown.sortField.lastModifiedAt',
    defaultMessage: 'Modified Date',
    description: 'Label of a field the entities can be sorted or searched by',
  },
  searchPlaceholder: {
    id: 'VisualizeDrilldown.searchPlaceholder',
    defaultMessage: 'Search by {field}...',
  },
  searchAria: {
    id: 'VisualizeDrilldown.searchAria',
    defaultMessage: 'Search {entityType} by {field}',
  },
  sortAria: {
    id: 'VisualizeDrilldown.sortAria',
    defaultMessage:
      'Sort by {field}, {direction, select, asc {ascending} desc {descending} other {not sorted}}',
  },
  selectPrompt: {
    id: 'VisualizeDrilldown.selectPrompt',
    defaultMessage: 'Select an entity type above to see its entities.',
  },
  legendCount: {
    id: 'VisualizeDrilldown.legendCount',
    defaultMessage: '{label} ({count})',
    description:
      'Legend entry: entity type label and the number of loaded entities',
  },
  legendCountOfTotal: {
    id: 'VisualizeDrilldown.legendCountOfTotal',
    defaultMessage: '{label} ({count} of {total})',
    description: 'Legend entry: loaded entities of the total on the server',
  },
  loadMoreAria: {
    id: 'VisualizeDrilldown.loadMoreAria',
    defaultMessage: 'Load more {entityType}',
  },
  tileAria: {
    id: 'VisualizeDrilldown.tileAria',
    defaultMessage: '{name}, {entityType}',
    description:
      'Accessible name of a treemap tile: entity name and entity type',
  },
  tileAriaWithDetails: {
    id: 'VisualizeDrilldown.tileAriaWithDetails',
    defaultMessage: '{name}, {entityType}, {details}',
  },
  breadcrumbAriaLabel: {
    id: 'VisualizeDrilldown.breadcrumbAriaLabel',
    defaultMessage: 'Drilldown path',
  },
  emptyRelated: {
    id: 'VisualizeDrilldown.emptyRelated',
    defaultMessage: 'This entity has no related entities.',
  },
  forbiddenRoot: {
    id: 'VisualizeDrilldown.forbiddenRoot',
    defaultMessage:
      'Could not load {entityType}: your project or user does not grant access to this resource ({endpoint}). A required permission is missing.',
  },
  forbiddenRelation: {
    id: 'VisualizeDrilldown.forbiddenRelation',
    defaultMessage:
      'Some related entities could not be loaded because a permission is missing: {entityTypes}.',
  },
  failedRelation: {
    id: 'VisualizeDrilldown.failedRelation',
    defaultMessage: 'Some related entities could not be loaded: {entityTypes}.',
  },
  missingProject: {
    id: 'VisualizeDrilldown.missingProject',
    defaultMessage: 'No project is selected, so no data can be loaded.',
  },
  truncatedNote: {
    id: 'VisualizeDrilldown.truncatedNote',
    defaultMessage:
      'The list of related ids was truncated to {max}; not all related entities are shown.',
  },
  showingFirst: {
    id: 'VisualizeDrilldown.showingFirst',
    defaultMessage: 'Showing first {shown} of {total}.',
  },
  loadingDetails: {
    id: 'VisualizeDrilldown.loadingDetails',
    defaultMessage: 'Loading details...',
  },
  summaryVariants: {
    id: 'VisualizeDrilldown.summary.variants',
    defaultMessage: 'has {count, plural, one {# variant} other {# variants}}',
    description: 'Extra line on a treemap tile',
  },
  summaryStandalonePrices: {
    id: 'VisualizeDrilldown.summary.standalonePrices',
    defaultMessage:
      'has {count, plural, one {# standalone price} other {# standalone prices}}',
    description: 'Extra line on a treemap tile',
  },
  summaryCategories: {
    id: 'VisualizeDrilldown.summary.categories',
    defaultMessage:
      'has {count, plural, one {# category} other {# categories}}',
    description: 'Extra line on a treemap tile',
  },
  summaryCustomers: {
    id: 'VisualizeDrilldown.summary.customers',
    defaultMessage: 'has {count, plural, one {# customer} other {# customers}}',
    description: 'Extra line on a treemap tile',
  },
  summaryProducts: {
    id: 'VisualizeDrilldown.summary.products',
    defaultMessage: 'has {count, plural, one {# product} other {# products}}',
    description: 'Extra line on a treemap tile',
  },
  summarySubcategories: {
    id: 'VisualizeDrilldown.summary.subcategories',
    defaultMessage:
      'has {count, plural, one {# subcategory} other {# subcategories}}',
    description: 'Extra line on a treemap tile',
  },
  summaryDivisions: {
    id: 'VisualizeDrilldown.summary.divisions',
    defaultMessage: 'has {count, plural, one {# division} other {# divisions}}',
    description: 'Extra line on a treemap tile',
  },
  summaryAssociates: {
    id: 'VisualizeDrilldown.summary.associates',
    defaultMessage:
      'has {count, plural, one {# associate} other {# associates}}',
    description: 'Extra line on a treemap tile',
  },
  summaryCartDiscounts: {
    id: 'VisualizeDrilldown.summary.cartDiscounts',
    defaultMessage:
      'has {count, plural, one {# cart discount} other {# cart discounts}}',
    description: 'Extra line on a treemap tile',
  },
  summaryUsedInStores: {
    id: 'VisualizeDrilldown.summary.usedInStores',
    defaultMessage: 'used in {count, plural, one {# store} other {# stores}}',
    description: 'Extra line on a treemap tile',
  },
  summaryUsedInChannels: {
    id: 'VisualizeDrilldown.summary.usedInChannels',
    defaultMessage:
      'used in {count, plural, one {# channel} other {# channels}}',
    description: 'Extra line on a treemap tile',
  },
  summaryStores: {
    id: 'VisualizeDrilldown.summary.stores',
    defaultMessage: '{count, plural, one {# store} other {# stores}}',
    description: 'Extra line on a treemap tile',
  },
  summaryProductSelections: {
    id: 'VisualizeDrilldown.summary.productSelections',
    defaultMessage:
      '{count, plural, one {# product selection} other {# product selections}}',
    description: 'Extra line on a treemap tile',
  },
  summaryBusinessUnits: {
    id: 'VisualizeDrilldown.summary.businessUnits',
    defaultMessage:
      'belongs to {count, plural, one {# business unit} other {# business units}}',
    description: 'Extra line on a treemap tile',
  },
  summaryDiscountedTo: {
    id: 'VisualizeDrilldown.summary.discountedTo',
    defaultMessage: 'discounted to {value}',
    description: 'Extra line on a treemap tile',
  },
});
