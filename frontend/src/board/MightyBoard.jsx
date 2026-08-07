import React from 'react';
import GenericBoard from '../engine/components/GenericBoard';
import { MightyBoardConfig } from './MightyBoardConfig';

export default function MightyBoard(props) {
  return <GenericBoard {...props} config={MightyBoardConfig} />;
}
