import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { useFavoritesStore } from '../../stores/favorites';

interface FavoriteButtonProps {
  hostId: string;
}

function FavoriteButtonInner({ hostId }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(hostId);

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(hostId)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isFav ? 'heart' : 'heart-outline'}
        size={20}
        color={isFav ? colors.red : colors.ink3}
      />
    </TouchableOpacity>
  );
}

export const FavoriteButton = React.memo(FavoriteButtonInner);
