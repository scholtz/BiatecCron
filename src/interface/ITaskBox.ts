export interface ITaskBox {
  /** The amount of funds availible that will pay for the task */
  funds: number;
  /** The app to execute */
  app: number;
  /** The amount of the assetId rewarded to the executor */
  fee: number;
}
