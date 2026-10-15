import type {
  ChangeEvent,
  LinkData,
  LocationData,
  NodeEntity,
} from '../hooks/types';

/**
 * Pure change functions. They never mutate their input and return the SAME
 * array reference when the change has no effect, so callers can use reference
 * equality to decide whether anything needs to be saved.
 */
export const applyLinkChange = (
  links: LinkData[],
  change: ChangeEvent
): LinkData[] => {
  switch (change.type) {
    case 'linkAdded': {
      if (links.some((link) => link.key === change.key)) {
        return links;
      }
      return [
        ...links,
        {
          key: change.key,
          from: change.fromNode,
          to: change.toNode,
          text: change.text,
          toText: change.toText,
        },
      ];
    }

    case 'linkModified': {
      const index = links.findIndex((link) => link.key === change.key);
      if (index === -1) {
        return links;
      }
      return links.map((link, i) =>
        i === index
          ? {
              ...link,
              from: change.newFromNode,
              to: change.newToNode,
              text: change.text,
              toText: change.toText,
            }
          : link
      );
    }

    case 'linkRemoved': {
      if (!links.some((link) => link.key === change.key)) {
        return links;
      }
      return links.filter((link) => link.key !== change.key);
    }

    case 'linkTextChanged': {
      const index = links.findIndex((link) => link.key === change.key);
      if (index === -1) {
        return links;
      }
      return links.map((link, i) => {
        if (i !== index) {
          return link;
        }
        return change.isFromText
          ? { ...link, text: change.newText }
          : { ...link, toText: change.newText };
      });
    }

    default:
      return links;
  }
};

export const applyLocationChange = (
  locations: LocationData[],
  change: ChangeEvent,
  knownNodeKeys: string[]
): LocationData[] => {
  if (change.type !== 'nodePositionChanged') {
    return locations;
  }
  const index = locations.findIndex((node) => node.key === change.nodeKey);
  if (index !== -1) {
    if (locations[index].loc === change.loc) {
      return locations;
    }
    return locations.map((node, i) =>
      i === index ? { ...node, loc: change.loc } : node
    );
  }
  if (knownNodeKeys.includes(change.nodeKey)) {
    return [...locations, { key: change.nodeKey, loc: change.loc }];
  }
  return locations;
};

/**
 * Keeps the first node per key. Node ids stay unprefixed to remain compatible
 * with links stored by the previous implementation, so a collision (e.g. a
 * Product Type name equal to a Type key) drops the later entity.
 */
export const dedupeNodes = (nodes: NodeEntity[]): NodeEntity[] => {
  const seen = new Set<string>();
  const result: NodeEntity[] = [];
  const warned = new Set<string>();
  nodes.forEach((node) => {
    if (seen.has(node.key)) {
      if (!warned.has(node.key)) {
        warned.add(node.key);
        console.warn(
          `Entity Diagram: duplicate node id "${node.key}", only the first entity is shown.`
        );
      }
      return;
    }
    seen.add(node.key);
    result.push(node);
  });
  return result;
};
