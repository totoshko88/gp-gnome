import {statusDotState, statusDotStyle} from '../../statusIndicator.js';

describe('Status indicator dot', () => {
    it('matches the README status color mapping', () => {
        expect(statusDotState({connected: true})).toBe('connected');
        expect(statusDotStyle('connected')).toContain('#8ff0a4');

        expect(statusDotState()).toBe('disconnected');
        expect(statusDotStyle('disconnected')).toContain('#f66151');

        expect(statusDotState({transitioning: true})).toBe('transitioning');
        expect(statusDotStyle('transitioning')).toContain('#f9f06b');

        expect(statusDotState({error: true})).toBe('error');
        expect(statusDotStyle('error')).toContain('#ff7800');
    });
});
