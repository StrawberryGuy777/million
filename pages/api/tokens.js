import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

const WALLET_ADDRESS = '64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy';
const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

// Initialize connection and UMI outside the handler for better performance
const connection = new Connection(SOLANA_RPC_ENDPOINT);
const umi = createUmi(SOLANA_RPC_ENDPOINT).use(mplTokenMetadata());

async function getTokenAccounts() {
    const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(WALLET_ADDRESS),
        {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }
    );
    return accounts.value
        .map((acc) => acc.account.data.parsed.info)
        .filter((info) => parseFloat(info.tokenAmount.amount) > 0);
}

async function getTokenMetadata(mintAddress) {
    try {
        const asset = await fetchDigitalAsset(umi, publicKey(mintAddress));
        return {
            name: asset.metadata.name,
            symbol: asset.metadata.symbol,
            decimals: asset.mint.decimals,
        };
    } catch {
        return {
            name: mintAddress,
            symbol: '',
            decimals: 0,
        };
    }
}



export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const tokens = await getTokenAccounts();
        console.log(`Found ${tokens.length} tokens with balances`);

        const enriched = await Promise.all(tokens.map(async (token, index) => {
            const mintAddress = token.mint;
            const amountRaw = token.tokenAmount.amount;
            const decimals = token.tokenAmount.decimals;
            const metadata = await getTokenMetadata(mintAddress);
            const amount = parseFloat(amountRaw) / Math.pow(10, decimals);

            console.log(`Processing token ${index + 1}/${tokens.length}: ${metadata.name || mintAddress}`);

            return {
                name: metadata.name,
                symbol: metadata.symbol,
                mintAddress,
                amount,
            };
        }));

        const sorted = enriched.sort((a, b) => b.amount - a.amount);
        const king = sorted[0];

        console.log(`King token: ${king.name} with amount ${king.amount}`);

        res.status(200).json({
            king,
            tokens: sorted,
            totalTokens: sorted.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch token data' });
    }
}