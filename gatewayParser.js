export function parseManualGatewayOutput(output) {
    const gateways = [];
    const lines = output.split('\n');
    let inGatewayList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('Name')) continue;

        if (trimmed.startsWith('---')) {
            inGatewayList = true;
            continue;
        }

        if (!inGatewayList) continue;

        const parts = trimmed.split(/\s+/);
        const addressIndex = parts.findIndex(part => part.includes('.'));
        if (addressIndex >= 0) {
            const name = parts.slice(0, addressIndex).join(' ').trim();
            const address = parts[addressIndex];
            const preferredText = parts.slice(addressIndex + 1).join(' ').trim().toLowerCase();

            gateways.push({
                name: name || address,
                address,
                preferred: preferredText === 'yes'
            });
        }
    }

    return gateways;
}
