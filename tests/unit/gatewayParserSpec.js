import {parseManualGatewayOutput} from '../../gatewayParser.js';
import {readFileSync} from 'node:fs';

const indicator = readFileSync(new URL('../../indicator.js', import.meta.url), 'utf8');

const manualGatewayOutput = `Name                Address            Preferred
-------------------------------------------------
Region One          region-one.gateway.example.com
Region Two          region-two.gateway.example.com
Area North          area-north.gateway.example.com
Area South          area-south.gateway.example.com
City Central        city-central.gateway.example.com
City East           city-east.gateway.example.com
Long Region Name    long-region-name.gateway.example.com
Single              single.gateway.example.com
Zone Northeast      zone-northeast.gateway.example.com
Zone Northwest      zone-northwest.gateway.example.com
Region Central      region-central.gateway.example.com
Area Southeast      area-southeast.gateway.example.com
City West           city-west.gateway.example.com
Zone Southwest      zone-southwest.gateway.example.com
Long Name Southeast long-name-southeast.gateway.example.com
Island              island.gateway.example.com
Country South       country-south.gateway.example.com
Region South        region-south.gateway.example.com
`;

describe('Gateway parser', () => {
    it('preserves multi-word gateway names and addresses', () => {
        const gateways = parseManualGatewayOutput(manualGatewayOutput);

        expect(gateways.length).toBe(18);
        expect(gateways.map(gateway => gateway.name)).toContain('Region Two');
        expect(gateways.map(gateway => gateway.name)).toContain('Region Central');
        expect(gateways.map(gateway => gateway.name)).toContain('Long Name Southeast');
        expect(gateways.filter(gateway => gateway.name === 'Region').length).toBe(0);

        const regionCentral = gateways.find(gateway => gateway.name === 'Region Central');
        expect(regionCentral.address).toBe('region-central.gateway.example.com');
    });
});

describe('Gateway menu wiring', () => {
    it('switches by gateway address while displaying gateway name', () => {
        expect(indicator).toContain('this._setGateway(gateway.address, gateway.name)');
        expect(indicator).not.toContain('this._setGateway(gateway.name)');
    });
});
