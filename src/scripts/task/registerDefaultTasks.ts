/* eslint-disable no-unused-vars */
import ITask from '../../interface/ITask';
import assertV1 from '../../templates/assert/v1';
import folksOracleV1 from '../../templates/folks-oracle/v1';
// eslint-disable-next-line import/no-cycle
import ifV1 from '../../templates/if/v1';
import mathV1 from '../../templates/math/v1';
import payV1 from '../../templates/pay/v1';
import scBalanceV1 from '../../templates/sc-balance/v1';
import varV1 from '../../templates/var/v1';
import { taskRegister } from './taskRenderer';

const registerDefaultTasks = () => {
  taskRegister('var@v1', varV1 as (task: ITask) => string);
  taskRegister('folks-oracle@v1', folksOracleV1 as (task: ITask) => string);
  taskRegister('math@v1', mathV1 as (task: ITask) => string);
  taskRegister('if@v1', ifV1 as (task: ITask) => string);
  taskRegister('pay@v1', payV1 as (task: ITask) => string);
  taskRegister('sc-balance@v1', scBalanceV1 as (task: ITask) => string);
  taskRegister('assert@v1', assertV1 as (task: ITask) => string);
};
export default registerDefaultTasks;
