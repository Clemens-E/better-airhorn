import IPCChildConnector from './IPCChildConnector';

export default class SimilarityHandler extends IPCChildConnector {

    public constructor() {
        super('SimilarityCalculator');
    }

    public add(name: string): Promise<boolean> {
        return this.send({ type: 'ADD_NAME', data: name });
    }

    public remove(name: string): Promise<boolean> {
        return this.send({ type: 'REMOVE_NAME', data: name });
    }

    public bestMatch(name: string): Promise<string> {
        return this.send({ type: 'CALCULATE_BEST_RESULT', data: name });
    }
}