import IPCChildConnector from './IPCChildConnector';

export default class SimilarityHandler extends IPCChildConnector {

    public constructor() {
        super('SimilarityCalculator', 'SimilarityCalculator');
    }

    public add(name: string): Promise<boolean> {
        return this.send({ type: 'ADD_NAME', data: name });
    }

    public remove(name: string): Promise<boolean> {
        return this.send({ type: 'REMOVE_NAME', data: name });
    }

    public clear(): Promise<boolean> {
        return this.send({ type: 'CLEAR_ALL' });
    }

    public bestMatch(name: string): Promise<string> {
        return this.send({ type: 'CALCULATE_BEST_RESULT', data: name });
    }
}