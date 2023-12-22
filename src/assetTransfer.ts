/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Asset } from './asset';

@Info({
  title: 'AssetTransfer',
  description: 'Smart contract for storing and fetching methane level data',
})
export class AssetTransferContract extends Contract {
  @Transaction()
  public async InitLedger(ctx: Context): Promise<void> {
    const assets: Asset[] = [
      {
        Timestamp: '00:00:00',
        Methanelevel: 0,
      },
    ];

    for (const asset of assets) {
      asset.docType = 'asset';
      // example of how to write to world state deterministically
      // use convetion of alphabetic order
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
      await ctx.stub.putState(
        asset.Timestamp,
        Buffer.from(stringify(sortKeysRecursive(asset)))
      );
      console.info(`Asset ${asset.Timestamp} initialized`);
    }
  }

  // CreateAsset issues a new asset to the world state with given details.
  @Transaction()
  public async CreateAsset(
    ctx: Context,
    timestamp: string,
    methanelevel: number
  ): Promise<void> {
    const exists = await this.AssetExists(ctx, timestamp);
    if (exists) {
      throw new Error(`Data for timestamp ${timestamp} already exists`);
    }

    const asset = {
      Timestamp: timestamp,
      Methanelevel: methanelevel,
    };
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(
      timestamp,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
  }

  // ReadAsset returns the asset stored in the world state with given id.
  @Transaction(false)
  public async ReadAsset(ctx: Context, timestamp: string): Promise<string> {
    const assetJSON = await ctx.stub.getState(timestamp); // get the asset from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`Data for timestamp ${timestamp} does not exist`);
    }
    return assetJSON.toString();
  }

  // UpdateAsset updates an existing asset in the world state with provided parameters.
  @Transaction()
  public async UpdateAsset(
    ctx: Context,
    timestamp: string,
    methanelevel: number
  ): Promise<void> {
    const exists = await this.AssetExists(ctx, timestamp);
    if (!exists) {
      throw new Error(`Data for timestamp ${timestamp} does not exist`);
    }

    // overwriting original asset with new asset
    const updatedAsset = {
      Timestamp: timestamp,
      Methanelevel: methanelevel,
    };
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(
      timestamp,
      Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
    );
  }

  // DeleteAsset deletes an given asset from the world state.
  @Transaction()
  public async DeleteAsset(ctx: Context, timestamp: string): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`Data for timestamp ${timestamp} does not exist`);
    }
    return ctx.stub.deleteState(timestamp);
  }

  // AssetExists returns true when asset with given ID exists in world state.
  @Transaction(false)
  @Returns('boolean')
  public async AssetExists(ctx: Context, timestamp: string): Promise<boolean> {
    const assetJSON = await ctx.stub.getState(timestamp);
    return assetJSON && assetJSON.length > 0;
  }

  // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
  // @Transaction()
  // public async TransferAsset(
  //   ctx: Context,
  //   id: string,
  //   newOwner: string
  // ): Promise<string> {
  //   const assetString = await this.ReadAsset(ctx, id);
  //   const asset = JSON.parse(assetString);
  //   const oldOwner = asset.Owner;
  //   asset.Owner = newOwner;
  //   // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
  //   await ctx.stub.putState(
  //     id,
  //     Buffer.from(stringify(sortKeysRecursive(asset)))
  //   );
  //   return oldOwner;
  // }

  // GetAllAssets returns all assets found in the world state.
  @Transaction(false)
  @Returns('string')
  public async GetAllAssets(ctx: Context): Promise<string> {
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        'utf8'
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}
