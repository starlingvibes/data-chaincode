/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {
  @Property()
  public docType?: string;

  @Property()
  public ID: string;

  @Property()
  public SNR: number;

  @Property()
  public VBAT: number;

  @Property()
  public Latitude: number;

  @Property()
  public Longitude: number;

  @Property()
  public Gas_resistance: number;

  @Property()
  public Temperature: number;

  @Property()
  public Pressure: number;

  @Property()
  public Humidity: number;

  @Property()
  public Light: number;

  @Property()
  public Gyroscope: number[];

  @Property()
  public Accelerometer: number[];

  @Property()
  public Owner: string;
}
