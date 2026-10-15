import { relationshipManager } from './relationship-utils';

describe('relationshipManager', () => {
  it('lists the root entity types in the original order', () => {
    expect(relationshipManager.getRootEntityTypes()).toEqual([
      'business-unit',
      'store',
      'customer-group',
      'product-selection',
      'channel',
      'category',
    ]);
  });

  it('returns the children of a store', () => {
    expect(relationshipManager.getChildrenForEntityType('store')).toEqual([
      'business-unit',
      'product-selection',
      'channel',
      'cart-discount',
      'customer',
    ]);
  });

  it('returns no children for leaf types', () => {
    expect(relationshipManager.getChildrenForEntityType('customer')).toEqual(
      []
    );
    expect(
      relationshipManager.getChildrenForEntityType('cart-discount')
    ).toEqual([]);
  });
});
