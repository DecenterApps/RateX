import React from 'react';
import './LoadingQuoteComponent.css';
import { useGlobalState } from '../context/GlobalStateProvider';

interface LoadingQuoteComponentProps {
    from: string;
    to: string;
}

const LoadingQuoteComponent: React.FC<LoadingQuoteComponentProps> = ({from, to}) => {
    const { routeFindingStep, setRouteFindingStep } = useGlobalState();

    return (
        <div>
            <div className='loader'/>
            <div className='loading-text'>{routeFindingStep}</div>
        </div>
    );
}

export default LoadingQuoteComponent;
