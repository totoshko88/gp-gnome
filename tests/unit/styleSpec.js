import {readFileSync} from 'node:fs';

const stylesheet = readFileSync(new URL('../../stylesheet.css', import.meta.url), 'utf8');
const indicator = readFileSync(new URL('../../indicator.js', import.meta.url), 'utf8');

const foregroundColorProperty = /(^|[;\n\r])\s*color\s*:/;

function cssRuleBodies(selector) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [...stylesheet.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'g'))]
        .map(match => match[1]);
}

function labelStyleStrings(source) {
    return [...source.matchAll(/new St\.Label\(\{[\s\S]*?style:\s*(['"`])([\s\S]*?)\1[\s\S]*?\}\)/g)]
        .map(match => match[2]);
}

function labelStyleAssignments(source) {
    return [...source.matchAll(/\b\w*Label\.style\s*=\s*(['"`])([\s\S]*?)\1/g)]
        .map(match => match[2]);
}

describe('Stylesheet theme compatibility', () => {
    it('does not force foreground colors on popup status labels', () => {
        const selectors = [
            '.globalprotect-status-label',
            '.globalprotect-connected',
            '.globalprotect-disconnected',
            '.globalprotect-transitioning',
            '.globalprotect-mfa-waiting',
        ];

        for (const selector of selectors) {
            for (const body of cssRuleBodies(selector)) {
                expect(body).not.toMatch(foregroundColorProperty);
            }
        }
    });
});

describe('Dialog theme compatibility', () => {
    it('does not force foreground colors on labels', () => {
        const styles = [
            ...labelStyleStrings(indicator),
            ...labelStyleAssignments(indicator),
        ];

        expect(styles.length).toBeGreaterThan(0);
        for (const style of styles) {
            expect(style).not.toMatch(foregroundColorProperty);
        }
    });

    it('does not use a white checkbox border', () => {
        expect(indicator).not.toContain('border: 2px solid #ffffff');
    });
});
