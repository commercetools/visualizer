# Data Model: Entity Diagram

## Read shapes (REST, via the MC API proxy `COMMERCETOOLS_PLATFORM`)

| Operation | Used fields |
|-----------|-------------|
| `GET /{projectKey}/product-types?limit=200&offset=n` | `id`, `key`, `name`, `attributes[].name` |
| `GET /{projectKey}/types?limit=200&offset=n` | `id`, `key`, `fieldDefinitions[].name` |
| Custom Objects, container `mc-custom-object-schema` (limit 200) | `key`, `value.attributes[].name` |
| Custom Object `mc-link-data` / `linkDataList` | see below |
| Custom Object `mc-link-data` / `locationDataList` | see below |

Further pages are requested until `total` is reached.

## Stored objects (written with Manage only)

```
linkDataList     = [ { key: string /* UUID */, from: string, to: string, text?: string, toText?: string } ]
locationDataList = [ { key: string /* node id */, loc: string /* "<x> <y>" */ } ]
```

Both are values of Custom Objects in container `mc-link-data`. A missing object is treated as `[]`.

## Node model (client side)

```
Node { id: string, kind: 'productType' | 'type' | 'schema', title: string,
       attributes: string[], inheritedAttributes?: string[] /* productType only */,
       position: { x: number, y: number } }
Edge { id: string, source: string, target: string, label?: string, targetLabel?: string }
```

Node colours: `productType` blue, `type` red, `schema` green.

## Update actions

None. Persistence is create-or-update of the two Custom Objects (`container` + `key`); the UI does no
`version` bookkeeping beyond what the Custom Objects API handles.
