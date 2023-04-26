import { ethers } from "ethers";

const duplicate = (value, n) => new Array(n).fill(value);

export class ExecutionLib {
  static OPERATION_TYPE_HASH = "0x05bfd119fc4bc5e1c9648b74edc051994bd2fe9e90827b03de35bbc8936d7d30";
  static CONDITION_TYPE_HASH = "0x1d0cda2640c2148f7f1ed2bd20bfcdec4f7bada4c8f0d3a01b16ab5506550627";
  static TOKEN_PERMISSIONS_TYPE =
    "0x546f6b656e5065726d697373696f6e73286164647265737320746f6b656e2c75696e7432353620616d6f756e7429";
  static EXECUTION_TYPE_HASH = "0x3c9dfbb6800c81949f298a500983cdffc392642f038a0694075b051a11365f82";

  static hashOperation(op) {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address", "bytes32"],
        [ExecutionLib.OPERATION_TYPE_HASH, op.to, ethers.utils.keccak256(op.data)],
      ),
    );
  }

  static hashOperations(operations) {
    return ethers.utils.solidityKeccak256(
      duplicate("bytes32", operations.length),
      operations.map(ExecutionLib.hashOperation),
    );
  }

  static hashCondition(condition) {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32"],
        [
          ExecutionLib.CONDITION_TYPE_HASH,
          condition.conditionType,
          condition.toCall,
          ethers.utils.keccak256(condition.data),
          ethers.utils.keccak256(condition.check),
        ],
      ),
    );
  }

  static hashConditions(conditions) {
    return ethers.utils.solidityKeccak256(
      duplicate("bytes32", conditions.length),
      conditions.map(ExecutionLib.hashCondition),
    );
  }

  static hashTokenPermission(permission) {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes", "address", "uint256"],
        [ExecutionLib.TOKEN_PERMISSIONS_TYPE, permission.token, permission.amount],
      ),
    );
  }

  static hash(execution) {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "bytes32"],
        [
          ExecutionLib.EXECUTION_TYPE_HASH,
          ExecutionLib.hashOperations(execution.operations),
          ExecutionLib.hashConditions(execution.conditions),
          ExecutionLib.hashTokenPermission(execution.payment),
        ],
      ),
    );
  }

  static hashWithWitness(permit, witness) {
    const typeHash = ethers.utils.solidityKeccak256(
      ["string", "string"],
      [
        "PermitBatchWitnessTransferFrom(TokenPermissions[] permitted,address spender,uint256 nonce,uint256 deadline,",
        "Execution witness)Execution(Operation[] operations,Condition[] conditions,TokenPermissions payment)Condition(uint8 conditionType,address toCall,bytes data,bytes check)Operation(address to,bytes data)TokenPermissions(address token,uint256 amount)",
      ],
    );

    const _TOKEN_PERMISSIONS_TYPEHASH = "0x618358ac3db8dc274f0cd8829da7e234bd48cd73c4a740aede1adec9846d06a1";

    const tokenHash = ethers.utils.solidityKeccak256(
      duplicate("bytes32", permit.permitted.length),
      permit.permitted.map(permit =>
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "(address,uint256)"],
            [_TOKEN_PERMISSIONS_TYPEHASH, [permit.token, permit.amount]],
          ),
        ),
      ),
    );

    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "address", "uint256", "uint256", "bytes32"],
        [typeHash, tokenHash, permit.spender, permit.nonce, permit.deadline, witness],
      ),
    );
  }

  static hashTypedData(domain, data) {
    return ethers.utils.keccak256(
      ethers.utils.concat(["0x1901", ethers.utils._TypedDataEncoder.hashDomain(domain), data]),
    );
  }
}
