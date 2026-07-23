import { View, Text } from 'react-native';
import React, { memo, useMemo } from 'react';
import Cell from './Cell';

const VerticalPath = ({ cells, color }) => {
  const groupedCells = useMemo(() => {
    const groups = [];
    for (let i = 0; i < cells.length; i += 3) {
      groups.push(cells.slice(i, i + 3));
    }
    return groups;
  }, [cells]);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '20%',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        {groupedCells.map((group, groupIndex) => (
          <View
            key={`group-${groupIndex}`}
            style={{ flexDirection: 'row', width: '100%', height: '16.7%' }}
          >
            {group.map((id, index) => (
              <View key={`cell-${id}`} style={{ width: '33.3%', height: '100%' }}>
                <Cell
                  cell={true}
                  id={id}
                  color={color}
                  index={`${groupIndex},${index}`}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default memo(VerticalPath);
