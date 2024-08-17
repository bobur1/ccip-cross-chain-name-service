import { BigNumber } from "ethers";

// Type for config from CCIPLocalSimulator contract
export type ConfigType = {
    chainSelector_: BigNumber;
    sourceRouter_: string;
    destinationRouter_: string;
    wrappedNative_: string;
    linkToken_: string;
    ccipBnM_: string;
    ccipLnM_: string;
};

// Type for S_Chain
export type S_Chain = {
    chainSelector: BigNumber;
    ccnsReceiverAddress: string;
    gasLimit: BigNumber;
};

// Constants
export const EMPTY_STRING = "";
export const GAS_LIMIT = 1_000_000;
export const NAME = 'alice.ccns';
