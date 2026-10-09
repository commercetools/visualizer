/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { EdgeProps, Edge, getBezierPath } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { TextInput } from '@commercetools/nimbus';
import { ChangeEvent } from './hooks/types';
import messages from './messages';

export interface CustomEdgeData extends Edge {
  data: {
    label?: string;
    toLabel?: string;
    trackLinkChange: (evt: ChangeEvent) => void;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

// The default labels are persisted data: keep the English literals.
const DEFAULT_FROM_LABEL = 'Label';
const DEFAULT_TO_LABEL = 'Relation';

export const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  selected,
}) => {
  const intl = useIntl();
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Labels live in local state so a change shows up without a parent re-render.
  const [label, setLabel] = useState<string | undefined>(data.label);
  const [toLabel, setToLabel] = useState<string | undefined>(data.toLabel);

  // State for tracking which label is being edited
  const [editingLabel, setEditingLabel] = useState<'from' | 'to' | null>(null);
  const [labelText, setLabelText] = useState('');

  // Calculate positions for both labels
  const midPointX = sourceX + (targetX - sourceX) * 0.5;
  const midPointY = sourceY + (targetY - sourceY) * 0.5;
  const fromLabelX = sourceX + (midPointX - sourceX) * 0.75;
  const fromLabelY = sourceY + (midPointY - sourceY) * 0.75;
  const toLabelX = midPointX + (targetX - midPointX) * 0.25;
  const toLabelY = midPointY + (targetY - midPointY) * 0.25;

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!label && !toLabel) {
      setLabel(DEFAULT_FROM_LABEL);
      setToLabel(DEFAULT_TO_LABEL);

      data.trackLinkChange({
        type: 'linkTextChanged',
        key: id,
        oldText: '',
        newText: DEFAULT_FROM_LABEL,
        isFromText: true,
      });
      data.trackLinkChange({
        type: 'linkTextChanged',
        key: id,
        oldText: '',
        newText: DEFAULT_TO_LABEL,
        isFromText: false,
      });
    }
  };

  const handleLabelClick = (type: 'from' | 'to') => {
    setEditingLabel(type);
    setLabelText((type === 'from' ? label : toLabel) ?? '');
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'from' | 'to') => {
    // Keep Backspace/Delete from reaching the canvas' delete-edge handler.
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.stopPropagation();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const oldText = (type === 'from' ? label : toLabel) ?? '';

      if (type === 'from') {
        setLabel(labelText);
      } else {
        setToLabel(labelText);
      }

      data.trackLinkChange({
        type: 'linkTextChanged',
        key: id,
        oldText,
        newText: labelText,
        isFromText: type === 'from',
      });

      setEditingLabel(null);
    }
  };

  const { setIsEditing } = data;
  useEffect(() => {
    setIsEditing(editingLabel !== null);
  }, [editingLabel, setIsEditing]);

  const renderLabel = (type: 'from' | 'to', text: string) =>
    editingLabel === type ? (
      <div className="nodrag nopan">
        <TextInput
          size="sm"
          value={labelText}
          onChange={(value) => setLabelText(value)}
          onKeyDown={(e) => handleKeyDown(e, type)}
          onBlur={() => setEditingLabel(null)}
          autoFocus
          aria-label={intl.formatMessage(messages.edgeLabelInput)}
        />
      </div>
    ) : (
      <div onClick={() => handleLabelClick(type)}>{text}</div>
    );

  return (
    <>
      <path
        id={`${id}-interaction`}
        className="react-flow__edge-interaction"
        d={edgePath}
        strokeWidth={20}
        fill="none"
        stroke="transparent"
        onDoubleClick={handleDoubleClick}
      />
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 3, // Make the visible edge wider
          stroke: selected ? '#1a192b' : '#b1b1b7', // Darker color when selected
          filter: selected ? 'drop-shadow(0 0 2px #1a192b)' : 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {/* From label */}
      {label && (
        <foreignObject
          x={fromLabelX - 70}
          y={fromLabelY - 14}
          width={140}
          height={28}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          {renderLabel('from', label)}
        </foreignObject>
      )}

      {/* To label */}
      {toLabel && (
        <foreignObject
          x={toLabelX - 70}
          y={toLabelY - 14}
          width={140}
          height={28}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          {renderLabel('to', toLabel)}
        </foreignObject>
      )}
    </>
  );
};
