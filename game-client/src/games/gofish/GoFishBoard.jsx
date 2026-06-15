import React from 'react';
import GenericBoard from '../../components/GenericBoard';
import { GoFishBoardConfig } from './GoFishBoardConfig';

export default function GoFishBoard(props) {
  return <GenericBoard {...props} config={GoFishBoardConfig} />;
}
