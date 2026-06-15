import React from 'react';
import GenericBoard from '../../components/GenericBoard';
import { WarBoardConfig } from './WarBoardConfig';

export default function WarBoard(props) {
  return <GenericBoard {...props} config={WarBoardConfig} />;
}
