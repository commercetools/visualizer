# Data Model: Visualize Drilldown

All operations are `GET` requests through the Merchant Center API proxy (`COMMERCETOOLS_PLATFORM` target).
Ids and keys placed into a `where` predicate are quoted and escaped; id lists use at most 100 ids.

## Entity types

`business-unit`, `store`, `customer-group`, `product-selection`, `channel`, `category` (roots) and
`customer`, `associate`, `product`, `cart-discount`, `standalone-price` (reachable by drilling).

## Client model

```
Entity { id, key?, version, name?: LocalizedString | string, createdAt?, lastModifiedAt?, ...raw }
Level  { parent?: Entity, entities: Entity[], total?: number }   // one per breadcrumb
```

## Root requests

`GET /<resource>?limit=20&offset=<n>[&where=<search>][&sort=<field> <asc|desc>]`

| Type | Search predicate | Sortable fields |
|------|------------------|-----------------|
| business-unit | `name="x"` | name, key, createdAt, lastModifiedAt |
| store, channel | `name(<dataLocale>="x")` | key, createdAt, lastModifiedAt |
| category | `name(<dataLocale>="x")` | key, orderHint, createdAt, lastModifiedAt |
| product-selection | `key="x"` | key, createdAt, lastModifiedAt |
| customer-group | `name="x"` | name, key, createdAt, lastModifiedAt |

## Relationship requests

| Parent to child | Request |
|---|---|
| business-unit to store | `/stores?where=key in (<bu.stores[].key>)` |
| business-unit to associate | `/customers?where=id in (<associate customer ids>)` |
| business-unit to business-unit | `/business-units?where=parentUnit(key="<key>")` |
| store to business-unit | `/business-units?where=stores(key="<key>")` |
| store to product-selection | `/product-selections?where=id in (<store product selection ids>)` |
| store to channel | `/channels?where=id in (<supply and distribution channel ids>)` |
| store to cart-discount | `/cart-discounts?where=stores(key="<key>")` |
| store to customer | `/customers?where=stores(key="<key>")` |
| customer-group to customer | `/customers?where=customerGroup(id="<id>")` |
| product-selection to product | `/product-selections/{id}/products?expand=product` |
| product-selection to store | `/stores?where=productSelections(productSelection(id="<id>"))` |
| channel to store | `/stores?where=supplyChannels(id="<id>") or distributionChannels(id="<id>")` |
| associate to business-unit | `/business-units?where=inheritedAssociates(customer(id="<id>")) or associates(customer(id="<id>"))` |
| product to product-selection | `/products/{id}/product-selections?expand=productSelection` |
| product to standalone-price | `/standalone-prices?where=sku in (<master and variant skus>)` |
| product to category | `/categories?where=id in (<category ids of the current projection>)` |
| standalone-price to product | `/products?where=masterData(current(masterVariant(sku="<sku>"))) or masterData(current(variants(sku="<sku>")))` |
| category to product | `/products?where=masterData(current(categories(id="<id>")))` |
| category to category | `/categories?where=parent(id="<id>")` |

## Colours (one slot per type; siblings differ)

| Hex | Types |
|---|---|
| `#2a78d6` | business-unit, standalone-price |
| `#eb6834` | store, customer-group |
| `#1baf7a` | product |
| `#eda100` | channel |
| `#e87ba4` | product-selection |
| `#008300` | category |
| `#4a3aa7` | customer, associate |
| `#e34948` | cart-discount |

## Update actions

None: the feature is read-only.
