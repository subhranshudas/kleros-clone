// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "hardhat/console.sol";

contract EscrowManager {
  event EscrowCreated(uint escrowId);
  event WorkSubmitted(uint escrowId);
  event WorkApproved(uint escrowId);
  event WorkRejected(uint escrowId);
  event EscrowDetails(
    address client,
    address worker,
    uint amount,
    bool clientDecisionGiven,
    bool isSettled,
    bool isDisputed,
    string agreement,
    string submission,
    address[] votesYes,
    address[] votesNo
  );
  event DisputeResolved(uint escrowId);
  event EscrowSettled(uint escrowId);
  event UserRegistered(address user, uint userType);

  address public escrowAdmin;

  struct Votes {
    address[] yes;
    address[] no;
  }

  struct Escrow {
   address payable client;
   address payable worker;
   uint amount;
   bool clientDecisionGiven;
   bool isSettled;
   bool isDisputed;
   string agreement;
   string submission;
   Votes votes;
  }

  // escrowId => EscrowDetails
  mapping(uint => Escrow) public escrows;

  // address => escrowId
  mapping(address => uint) public voters;

  // client address => "escrowId"s
  mapping(address => uint[]) public clientEscrowIdsMapping;

  // worker address =>  "escrowId"s
  mapping(address => uint[]) public workerEscrowIdsMapping;

  uint private escrowId = 1;

  // keeps a list of escrowIds
  uint[] public escrowIds;


  /**
   * NO USER = 0
   * ADMIN = 1
   * CLIENT = 2
   * WORKER = 3
   * VOTER = 4
   */

  mapping (address => uint) public userType;

  constructor() {
    escrowAdmin = msg.sender;
    userType[msg.sender] = 1;
  }

  modifier isAdmin (address _addr) {
    require(_addr == escrowAdmin, "Not Admin");
    _;
  }

  modifier escrowExists(uint _escrowId) {
    require(escrows[_escrowId].client != address(0), "Escrow does not exist!");
    _;
  }

  modifier isDisputeResolved(uint _escrowId) {
    require(!escrows[_escrowId].isDisputed, "Escrow dispute not resolved!");
    _;
  }

  modifier isNotEscrowSettled(uint _escrowId) {
    require(!escrows[_escrowId].isSettled, "Escrow already settled");
    _;
  }

  function getClientEscrowIds() public view returns (uint[] memory) {
    require(clientEscrowIdsMapping[msg.sender].length > 0, "Client does not exist");
    return clientEscrowIdsMapping[msg.sender];
  }

  function getWorkerEscrowIds() public view returns (uint[] memory) {
    require(workerEscrowIdsMapping[msg.sender].length > 0, "Worker does not exist");
    return workerEscrowIdsMapping[msg.sender];
  }

  /*
  * clients create escrow
  */
  function createEscrow(address _worker, uint _amount, string memory _agreement)
    public payable {
    require(msg.value > 0, "Escrow amount should not be 0");
    require(msg.value == _amount, "Amount mismatch");

    address[] memory _yes;
    address[] memory _no;

    escrows[escrowId] = Escrow({
      client: payable(msg.sender),
      worker: payable(_worker),
      amount: _amount,
      isSettled: false,
      isDisputed: false,
      clientDecisionGiven: false,
      agreement: _agreement,
      submission: "",
      votes: Votes(_yes, _no)
    });
    
    escrowIds.push(escrowId);

    // set user type
    userType[msg.sender] = 2;
    userType[_worker] = 3;

    // add escrowIds to client, worker mappings
    clientEscrowIdsMapping[msg.sender].push(escrowId);
    workerEscrowIdsMapping[_worker].push(escrowId);

    escrowId++;

    emit EscrowCreated(escrowId - 1);
  }

  /*
  * workers submit work
  */

  function submitWork(uint _escrowId, string memory _submission) public escrowExists(_escrowId) {
    require(bytes(_submission).length > 0, "Empty submission");

    escrows[_escrowId].submission = _submission;
    emit WorkSubmitted(_escrowId);
  }

  /*
  * clients approve or reject work
  */

  function approveWork(bool _approval, uint _escrowId) public {
    require(bytes(escrows[_escrowId].submission).length > 0, "Cannot judge unsubmitted work");

    escrows[_escrowId].clientDecisionGiven = true;

    if (_approval) {
      escrows[_escrowId].isDisputed = false;
      emit WorkApproved(_escrowId);
    } else { // DISPUTED FLOW
      escrows[_escrowId].isDisputed = true;
      emit WorkRejected(_escrowId);
    }
  }

  /*
  * Voters vote for the dispute
  */
  function voteForDispute(uint _escrowId, bool _validWork) public
    escrowExists(_escrowId) {
    Escrow storage _escrow = escrows[_escrowId];

    // cannot vote if already dispute is resolved
    require(_escrow.isDisputed, "Dispute already resolved");

    // cannot be admin, client, worker
    require(
      msg.sender != escrowAdmin &&
      msg.sender != _escrow.client &&
      msg.sender != _escrow.worker,
      "Only neutral voter!"
    );
    
    if (_validWork) {
      _escrow.votes.yes.push(msg.sender);
    } else {
      _escrow.votes.no.push(msg.sender);
    }
    
    _escrow.isDisputed = false;
    emit DisputeResolved(_escrowId);
  }

  /*
  * Only admin can disburse funds
  */
  function disburseFunds(uint _escrowId) public
    isAdmin(msg.sender)
    isDisputeResolved(_escrowId)
    isNotEscrowSettled(_escrowId) {
      Escrow storage _escrow = escrows[_escrowId];

      // for simplicity of the POC, only 1 vote
      bool isValidWork = _escrow.votes.yes.length >= _escrow.votes.no.length;
      address whomToPay = isValidWork ? _escrow.worker : _escrow.client;
    
      (bool success, ) = payable(whomToPay).call{ value: _escrow.amount }("");
      require(success, "TRANSFER FAILED!");

      escrows[_escrowId].isSettled = true;

      emit EscrowSettled(_escrowId);
  }

  /*
  * Gives escrow details for an escrowId
  */
  function getEscrowDetails(uint _escrowId) public {
    require(escrows[_escrowId].client != address(0), "Escrow does not exist!");
    
    Escrow memory _escrow = escrows[_escrowId];

    emit EscrowDetails(
      _escrow.client,
      _escrow.worker,
      _escrow.amount,
      _escrow.clientDecisionGiven,
      _escrow.isSettled,
      _escrow.isDisputed,
      _escrow.agreement,
      _escrow.submission,
      _escrow.votes.yes,
      _escrow.votes.no
    );
  }

  function getUserType() public view returns (uint) {
    return userType[msg.sender];
  }

  function registerUser(uint _userType) public {
    // for now have taken a simple design of 1 user = 1 user type
    require(userType[msg.sender] == 0, "User already exists!");
    
    // only "client" & "voter" can register themselves 
    bool onlyClientOrVoter = (_userType == 2 || _userType == 4);
    require(onlyClientOrVoter, "Only Client or Voter can register");

    userType[msg.sender] = _userType;

    emit UserRegistered(msg.sender, _userType);
  }
}