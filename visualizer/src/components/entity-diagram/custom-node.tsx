import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { useIntl } from 'react-intl';
import { Text } from '@commercetools/nimbus';
import { NodeEntity } from './hooks/types';
import messages from './messages';

export interface CustomNodeType extends Node {
  data: {
    label: string;
    items: NodeEntity['items'];
    inheritedItems: NodeEntity['inheritedItems'];
  };
}

const listStyle = { listStyleType: 'none', padding: 0, margin: 0 } as const;
const sectionStyle = { padding: '15px 10px 0' } as const;
const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 5px',
} as const;
const dotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  marginRight: '5px',
} as const;

export const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({ data }) => {
  const intl = useIntl();
  const nodeColor = data.items?.[0]?.color;
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: nodeColor ? `solid 2px ${nodeColor}` : undefined,
        padding: '10px 5px',
        minWidth: '150px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: '10px', height: '10px' }}
      />

      {/* Node title */}
      <div style={{ textAlign: 'center', margin: '10px 0 0 10px' }}>
        <Text fontWeight="600">{data.label}</Text>
      </div>

      {/* Attributes */}
      {data.items && data.items.length > 0 && (
        <div style={{ ...sectionStyle, borderTop: '1px solid #e5e5e5' }}>
          <Text fontWeight="500">
            {intl.formatMessage(messages.attributes)}
          </Text>
          <ul style={listStyle}>
            {data.items.map((item, index) => (
              <li key={index} style={itemStyle}>
                <div style={{ ...dotStyle, backgroundColor: item.color }} />
                <Text
                  fontSize="350"
                  fontStyle={item.iskey ? 'italic' : 'normal'}
                >
                  {item.name}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inherited attributes */}
      {data.inheritedItems && data.inheritedItems.length > 0 && (
        <div style={sectionStyle}>
          <Text fontWeight="500">
            {intl.formatMessage(messages.inheritedAttributes)}
          </Text>
          <ul style={listStyle}>
            {data.inheritedItems.map((item, index) => (
              <li key={index} style={itemStyle}>
                <div style={{ ...dotStyle, backgroundColor: 'black' }} />
                <Text fontSize="350">{item.name}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
