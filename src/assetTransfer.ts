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
  description: 'Smart contract for storing and trading data assets',
})
export class AssetTransferContract extends Contract {
  @Transaction()
  public async InitLedger(ctx: Context): Promise<void> {
    const assets: Asset[] = [
      {
        ID: 'basdni7s8acadad8a9d8',
        SNR: 0.5,
        VBAT: 3.3,
        Latitude: 45.464664,
        Longitude: 12.2629,
        Gas_resistance: 0.5,
        Temperature: 31.7,
        Pressure: 1000.5,
        Humidity: 50.5,
        Light: 0.5,
        Gyroscope: [0.5, 0.5, 0.5],
        Accelerometer: [0.5, 0.5, 0.5],
        Owner: `Chidera's IoT device 1`,
      },
    ];

    for (const asset of assets) {
      asset.docType = 'asset';
      // example of how to write to world state deterministically
      // use convetion of alphabetic order
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
      await ctx.stub.putState(
        asset.ID,
        Buffer.from(stringify(sortKeysRecursive(asset)))
      );
      console.info(`Asset ${asset.ID} initialized`);
    }
  }

  // CreateAsset issues a new asset to the world state with given details.
  @Transaction()
  public async CreateAsset(
    ctx: Context,
    id: string,
    snr: number,
    vbat: number,
    latitude: number,
    longitude: number,
    gas_resistance: number,
    temperature: number,
    pressure: number,
    humidity: number,
    light: number,
    gyroscope: number[],
    accelerometer: number[],
    owner: string
  ): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (exists) {
      throw new Error(`The asset ${id} already exists`);
    }

    const asset = {
      ID: id,
      SNR: snr,
      VBAT: vbat,
      Latitude: latitude,
      Longitude: longitude,
      Gas_resistance: gas_resistance,
      Temperature: temperature,
      Pressure: pressure,
      Humidity: humidity,
      Light: light,
      Gyroscope: gyroscope,
      Accelerometer: accelerometer,
      Owner: owner,
    };
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
  }

  // ReadAsset returns the asset stored in the world state with given id.
  @Transaction(false)
  public async ReadAsset(ctx: Context, id: string): Promise<string> {
    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  // UpdateAsset updates an existing asset in the world state with provided parameters.
  @Transaction()
  public async UpdateAsset(
    ctx: Context,
    id: string,
    snr: number,
    vbat: number,
    latitude: number,
    longitude: number,
    gas_resistance: number,
    temperature: number,
    pressure: number,
    humidity: number,
    light: number,
    gyroscope: number[],
    accelerometer: number[],
    owner: string
  ): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }

    // overwriting original asset with new asset
    const updatedAsset = {
      ID: id,
      SNR: snr,
      VBAT: vbat,
      Latitude: latitude,
      Longitude: longitude,
      Gas_resistance: gas_resistance,
      Temperature: temperature,
      Pressure: pressure,
      Humidity: humidity,
      Light: light,
      Gyroscope: gyroscope,
      Accelerometer: accelerometer,
      Owner: owner,
    };
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
    );
  }

  // DeleteAsset deletes an given asset from the world state.
  @Transaction()
  public async DeleteAsset(ctx: Context, id: string): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  // AssetExists returns true when asset with given ID exists in world state.
  @Transaction(false)
  @Returns('boolean')
  public async AssetExists(ctx: Context, id: string): Promise<boolean> {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }

  // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
  @Transaction()
  public async TransferAsset(
    ctx: Context,
    id: string,
    newOwner: string
  ): Promise<string> {
    const assetString = await this.ReadAsset(ctx, id);
    const asset = JSON.parse(assetString);
    const oldOwner = asset.Owner;
    asset.Owner = newOwner;
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
    return oldOwner;
  }

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
