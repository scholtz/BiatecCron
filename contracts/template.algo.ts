import { Contract } from '@algorandfoundation/tealscript';

/** Task manager task */
type Task = {
  /** The amount of funds availible that will pay for the task */
  funds: uint64;
  /** The app to execute */
  app: AppID;
  /** The amount of the assetId rewarded to the executor */
  fee: uint64;
};
/**
 * Decentralized scheduler task - https://scheduler.biatec.io
 */
// eslint-disable-next-line no-unused-vars, camelcase
class BiatecCronJob__SHORT_HASH__ extends Contract {
  /**
   * Identifier of the input app
   */
  id = GlobalStateKey<string>({ key: 'id' });

  /**
   * Last time in unix timestamp when this app has been executed
   */
  lastRun = GlobalStateKey<uint64>({ key: 'l' });

  /**
   * Period in seconds how often this smart contract can be run
   */
  period = GlobalStateKey<uint64>({ key: 'p' });

  /**
   * Start time in unix timestamp seconds. Contract can be exectuted when Math.floor((currentTime + start) / period) > Math.floor((lastRun + start) / period)
   */
  start = GlobalStateKey<uint64>({ key: 's' });

  /**
   * Pool manager application
   */
  appPoolManager = GlobalStateKey<AppID>({ key: 'pool' });

  /**
   * Version of the smart contract
   */
  version = GlobalStateKey<string>({ key: 'scver' });

  /**
   * Initial setup
   */
  createApplication(): void {
    this.lastRun.value = 0;
    this.period.value = 0;
    this.start.value = 0;
    this.version.value = 'BIATEC-CRON-01-01-01';
  }

  /**
   * Creator can update application
   */
  updateApplication(version: string, id: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    this.version.value = version;
    this.id.value = id;
  }

  /**
   * Creator can delete application
   */
  deleteApplication(): void {
    assert(this.txn.sender === globals.creatorAddress);
  }

  /**
   * Creator can unregisterApplication before he deletes it
   *
   * @param appPoolManager Pool manager where the task is registered
   * @param indexToDelete App index to delete from user's apps
   */
  unregisterApplication(appPoolManager: AppID, indexToDelete: uint64): void {
    assert(this.txn.sender === globals.creatorAddress);
    assert(this.appPoolManager.value === appPoolManager);
    sendMethodCall<[AppID, uint64], void>({
      name: 'unregisterTask',
      methodArgs: [globals.currentApplicationID, indexToDelete],
      applicationID: appPoolManager,
      fee: 0,
    });
  }

  /**
   * Creator can change the period how ofter the script can be executed by executors
   *
   * @param period Period in seconds
   */
  setPeriod(period: uint64) {
    assert(this.txn.sender === globals.creatorAddress);
    this.period.value = period;
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   *
   * @param amount Amount
   * @param note Note
   * @param receiver Receiver
   */
  payment(amount: uint64, receiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendPayment({
      amount: amount,
      receiver: receiver,
      note: note,
    });
    assert(this.txn.sender === globals.creatorAddress);
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   * @param xferAsset Asset id
   * @param assetAmount Amount
   * @param note Note
   * @param assetReceiver Receiver
   */
  assetTransfer(xferAsset: AssetID, assetAmount: uint64, assetReceiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendAssetTransfer({
      assetAmount: assetAmount,
      assetReceiver: assetReceiver,
      xferAsset: xferAsset,
      note: note,
    });
  }

  /**
   * Bootstrap the contract to optin to the fee asset and setup basic variables
   *
   * @param appPoolManager Tasks Pool manager app
   * @param txBaseDeposit Deposit MBR
   * @param id Hash id of the input app
   * @param period  Period in seconds how often this smart contract can be run
   * @param start Start time in unix timestamp seconds. Contract can be exectuted when Math.floor((currentTime + start) / period) > Math.floor((lastRun + start) / period)
   * @param fee Execution fee for the task
   */
  bootstrap(
    appPoolManager: AppID,
    txBaseDeposit: PayTxn,
    id: string,
    period: uint64,
    start: uint64,
    fee: uint64
  ): void {
    assert(this.txn.sender === globals.creatorAddress);
    verifyPayTxn(txBaseDeposit, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: 0 },
    });

    let keep = 100000;
    if (globals.minBalance > keep) keep = globals.minBalance;
    /**
     * This will send notification to cron
     */
    const task: Task = {
      app: globals.currentApplicationID,
      fee: fee,
      funds: 0,
    };

    sendMethodCall<[PayTxn, Task], void>({
      name: 'registerTask',
      methodArgs: [
        {
          amount: globals.currentApplicationAddress.balance - keep,
          note: 'reg',
          receiver: appPoolManager.address,
          fee: 0,
        },
        task,
      ],
      applicationID: appPoolManager,
      fee: 0,
    });

    assert(period > 0);
    this.id.value = id;
    this.period.value = period;
    this.start.value = start;
    this.appPoolManager.value = appPoolManager;
  }

  /**
   * Creator can perfom key registration for this LP pool
   */
  sendOnlineKeyRegistration(
    votePk: bytes,
    selectionPk: bytes,
    stateProofPk: bytes,
    voteFirst: uint64,
    voteLast: uint64,
    voteKeyDilution: uint64
  ): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendOnlineKeyRegistration({
      selectionPK: selectionPk,
      stateProofPK: stateProofPk,
      voteFirst: voteFirst,
      voteKeyDilution: voteKeyDilution,
      voteLast: voteLast,
      votePK: votePk,
      fee: 0,
    });
  }

  /**
   * Creator can perfom key unregistration for this LP pool
   */
  sendOfflineKeyRegistration(): void {
    assert(this.txn.sender === globals.creatorAddress);
    sendOfflineKeyRegistration({ fee: 0 });
  }

  /**
   * No op, for purpose of adding extra resources to the tx group
   */
  noop(): void {
    assert(this.txn.sender === globals.creatorAddress);
  }

  /**
   * Anyone can execute this scheduler method when time is right and he will be rewarded the fee
   */
  exec(): void {
    assert(this.start.value <= globals.latestTimestamp, 'ERR_NO_START_YET');
    assert(
      (globals.latestTimestamp + this.start.value) / this.period.value >
        (this.lastRun.value + this.start.value) / this.period.value,
      'ERR_NO_TIME_YET'
    );
    this.lastRun.value = globals.latestTimestamp;

    // __SCRIPT__;
  }
}
