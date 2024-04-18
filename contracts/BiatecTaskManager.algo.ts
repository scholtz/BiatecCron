import { Contract } from '@algorandfoundation/tealscript';

export type Task = {
  /** The amount of funds availible that will pay for the task */
  funds: uint64;
  /** The app to execute */
  app: AppID;
  /** The amount of the assetId rewarded to the executor */
  fee: uint64;
};

export class BiatecTaskManager extends Contract {
  /** All of the available tasks */
  tasks = BoxMap<AppID, Task>();

  /**
   * Fee token - asset id, 0 for native token
   */
  feeAssetId = GlobalStateKey<uint64>({ key: 'fa' });

  /**
   * Sum of all deposited funds
   */
  depositedFunds = GlobalStateKey<uint64>({ key: 'd' });

  /**
   * Version of the smart contract
   */
  version = GlobalStateKey<string>({ key: 'scver' });

  /**
   * Initial setup
   */
  createApplication(): void {
    this.version.value = 'BIATEC-CRON-POOL-01-01-01';
  }

  /**
   * Creator can update application
   * @param version App version
   */
  updateApplication(version: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    this.version.value = version;
  }

  /**
   * Bootstrap the contract to optin to the fee asset and setup basic variables
   *
   * @param txBaseDeposit Deposit MBR
   * @param feeAssetId  Fee asset id
   */
  bootstrap(txBaseDeposit: PayTxn, feeAssetId: AssetID): void {
    assert(this.txn.sender === globals.creatorAddress);

    verifyPayTxn(txBaseDeposit, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: 0 },
    });

    this.feeAssetId.value = feeAssetId.id;

    // if (globals.genesisHash === base64Decode('StdEncoding', 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=')) {
    //   this.feeToken.value = 1241944285; // asa.gold Mainnet
    // } else if (globals.genesisHash === base64Decode('StdEncoding', 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=')) {
    //   this.feeToken.value = 450822081; // asa.gold Testnet
    // } else if (globals.genesisHash === base64Decode('StdEncoding', 'IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=')) {
    //   this.feeToken.value = 26174498; // asa.gold voitest
    // } else {
    //   this.feeToken.value = 0;
    //   // assert(false, 'Wrong network');
    // }

    if (this.feeAssetId.value > 0) {
      sendAssetTransfer({
        assetReceiver: globals.currentApplicationAddress,
        assetAmount: 0,
        xferAsset: AssetID.fromUint64(this.feeAssetId.value),
      });
    }
  }

  /**
   * Register a task to be executed
   * Only app it self can call register task
   *
   * @param registrationFeeDeposit The axfer or pay that deposits the initial funds
   * @param task The task object
   */
  registerTask(registrationFeeDeposit: PayTxn, task: Task): void {
    assert(this.txn.sender === task.app.address); // only the app it self can register itself
    assert(task.funds === 0); // inital funds is zero

    verifyPayTxn(registrationFeeDeposit, {
      receiver: this.app.address,
    });
    assert(registrationFeeDeposit.amount > 500_000);

    this.tasks(task.app).value = task;
  }

  /**
   * Execute a task and get the reward
   *
   * @param taskAppCall The call to the task app
   */
  executeTask(taskAppCall: AppCallTxn): void {
    // task
    const task = this.tasks(taskAppCall.applicationID).value;

    // send the reward
    if (this.feeAssetId.value === 0) {
      sendPayment({
        receiver: this.txn.sender,
        amount: task.fee,
      });
    } else {
      sendAssetTransfer({
        assetReceiver: this.txn.sender,
        assetAmount: task.fee,
        xferAsset: AssetID.fromUint64(this.feeAssetId.value),
      });
    }

    // substract the reward from available funds
    // if there aren't enough funds, this will cause AVM panic
    task.funds -= task.fee;
  }

  /**
   * Deposit funds for a task
   *
   * @param taskAppId The ID of the task to fund
   * @param deposit The pay or axfer to fund the task
   */
  fundTask(taskAppId: AppID, deposit: Txn): void {
    const task = this.tasks(taskAppId).value;

    if (this.feeAssetId.value === 0) {
      verifyPayTxn(deposit, {
        receiver: this.app.address,
      });
      const fee = deposit.amount / 100;
      task.funds += deposit.amount - fee;
      this.depositedFunds.value += deposit.amount - fee;
    } else {
      verifyAssetTransferTxn(deposit, {
        assetReceiver: this.app.address,
        xferAsset: AssetID.fromUint64(this.feeAssetId.value),
      });
      const fee = deposit.amount / 100;
      task.funds += deposit.assetAmount - fee;
      this.depositedFunds.value += deposit.assetAmount - fee;
    }
  }

  /**
   * Remove funds for a task
   * Creator of the underlying task can remove the funds from the pool
   *
   * @param taskAppId The ID of the task to fund
   * @param amount The amount to withdraw from the pool
   */
  unfundTask(taskAppId: AppID, amount: uint64): void {
    const task = this.tasks(taskAppId).value;
    assert(this.txn.sender === task.app.creator);
    task.funds -= amount;
    this.depositedFunds.value -= amount;
    if (this.feeAssetId.value === 0) {
      sendPayment({
        amount: amount,
        receiver: this.txn.sender,
        fee: 0,
      });
    } else {
      sendAssetTransfer({
        assetAmount: amount,
        xferAsset: AssetID.fromUint64(this.feeAssetId.value),
        assetReceiver: this.txn.sender,
        fee: 0,
      });
    }
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   *
   * @param sender Sender. This app id or any rekeyed account to the address of this sc
   * @param amount Amount
   * @param note Note
   * @param receiver Receiver
   */
  payment(sender: Address, amount: uint64, receiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    if (this.feeAssetId.value === 0) {
      // do not allow to withdraw more funds than is deposited by clients
      assert(globals.currentApplicationAddress.balance - amount >= this.depositedFunds.value);
    }
    sendPayment({
      amount: amount,
      receiver: receiver,
      note: note,
      sender: sender,
    });
  }

  /**
   * Creator can send pay/axfer transaction out of the smart contract
   * @param sender Sender. This app id or any rekeyed account to the address of this sc
   */
  assetTransfer(sender: Address, xferAsset: AssetID, assetAmount: uint64, assetReceiver: Address, note: string): void {
    assert(this.txn.sender === globals.creatorAddress);
    if (this.feeAssetId.value === xferAsset.id) {
      // do not allow to withdraw more funds than is deposited by clients
      assert(globals.currentApplicationAddress.assetBalance(xferAsset) - assetAmount >= this.depositedFunds.value);
    }
    sendAssetTransfer({
      assetAmount: assetAmount,
      assetReceiver: assetReceiver,
      xferAsset: xferAsset,
      note: note,
      assetSender: sender,
    });
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
}
