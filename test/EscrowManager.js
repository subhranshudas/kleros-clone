const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowManager Contract", () => {
    let EscrowManager, escrowManager;
    let signers;
	let escrowAdmin;
    let client;
    let worker;
    let voter;
    let random;

    beforeEach(async () => {
        signers = await ethers.getSigners();
		escrowAdmin = signers[0];
        client = signers[1];
        worker = signers[2];
        voter = signers[3];
        random = signers[4];

        EscrowManager = await ethers.getContractFactory("EscrowManager");
        escrowManager = await EscrowManager.deploy();
    });

    it("deployment should assign an escrowAdmin", async () => {
        const admin = await escrowManager.escrowAdmin();
        expect(admin).equal(escrowAdmin.address);
    });

    it("createEscrow() should create a new escrow", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // 1st escrow
        txn = await escrowManager.connect(client).createEscrow(
          worker.address, contractAmount, agreement,
          {value: contractAmount}
        );
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);

        ++escrowsCreated;

        // 2nd escrow
        agreement = agreement + " " + "2";
        contractAmount = contractAmount + 100;

        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);
        
    });

    it("createEscrow() should fail if amount is 0", async () => {
        let contractAmount = 0;
        let agreement = "Build a website";

        // create escrow with 0
        await expect(
            escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount})
        ).to.be.revertedWith("Escrow amount should not be 0");
    });

    it("getEscrowDetails() should give details for an escrowId", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId, eventArgs;
        let escrowsCreated = 0;

        // 1st escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


        txn = await escrowManager.connect(client).getEscrowDetails(escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;

        expect(eventArgs.client).equal(client.address);
        expect(eventArgs.worker).equal(worker.address);
        expect(eventArgs.amount.toString()).equal(contractAmount.toString());
        expect(eventArgs.agreement).equal(agreement);
    });

    it("getEscrowDetails() should fail if escrowId not present", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId, eventArgs;
        let escrowsCreated = 0;

        // 1st escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);

        // get details for non existent id
        await expect(
            escrowManager.connect(escrowAdmin).getEscrowDetails(100)
        ).to.be.revertedWith("Escrow does not exist!");
    });

    it("getUserType() should give userType", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // 1st escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);

        let userType;

        userType = await escrowManager.connect(escrowAdmin).getUserType();
        expect(userType).equal(1);

        userType = await escrowManager.connect(client).getUserType();
        expect(userType).equal(2);

        userType = await escrowManager.connect(worker).getUserType();
        expect(userType).equal(3);

        userType = await escrowManager.connect(random).getUserType();
        expect(userType).equal(0);
    });

    it("submitWork() should let worker submit their work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, _escrowId, eventArgs;
        let escrowsCreated = 0;

        // 1st escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        eventArgs = events[0]?.args;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(eventArgs.escrowId).equal(_escrowId);
        expect(eventArgs.submission).equal(undefined);

        // worker submits
        const work = "worker has done work";

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;

        expect(submittedEscrowId).equal(_escrowId);

        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;

        expect(eventArgs.submission).equal(work);

    });

    it("approveWork() should let client approve a work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement.slice();

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client approves
        txn = await escrowManager.connect(client).approveWork(true, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkApproved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;

        expect(eventArgs.isDisputed).equal(false);

    });

    it("approveWork() should let client reject a work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement + ' 2';

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;

        expect(eventArgs.isDisputed).equal(true);

    });

    it("approveWork() should not let client approve/reject an unsubmitted work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);

        // client approves
        await expect(
            escrowManager.connect(client).approveWork(true, _escrowId)
        ).to.be.revertedWith("Cannot judge unsubmitted work");
    });

    it("voteForDispute() should let a neutral voter to vote true for validating work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement.slice();

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, true);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);

        expect(eventArgs.votesYes.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesYes;
        expect(whoVoted).equal(voter.address);

    });

    it("voteForDispute() should let a neutral voter to vote false for validating work", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement.slice();

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, false);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);
        expect(eventArgs.votesNo.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesNo;
        expect(whoVoted).equal(voter.address);
    });

    it("voteForDispute() only a neutral voter can vote", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement.slice();

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // client votes
        await expect(
			escrowManager.connect(client).voteForDispute(_escrowId, true)
		).to.be.revertedWith("Only neutral voter!");

        // worker votes
        await expect(
            escrowManager.connect(worker).voteForDispute(_escrowId, true)
        ).to.be.revertedWith("Only neutral voter!");

        // escrowAdmin votes
        await expect(
            escrowManager.connect(escrowAdmin).voteForDispute(_escrowId, true)
        ).to.be.revertedWith("Only neutral voter!");

    });

    it("disburseFunds() to worker if dispute is in worker favor", async () => {
        let contractAmount = ethers.utils.parseEther("2.8");
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement.slice();

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, true);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);

        expect(eventArgs.votesYes.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesYes;
        expect(whoVoted).equal(voter.address);

        const _escrowAmount = eventArgs.amount;

        const balanceOfAdminBefore = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfWorkerBefore = await ethers.provider.getBalance(worker.address);
        const balanceOfClientBefore = await ethers.provider.getBalance(client.address);

        // admin disburses
        txn = await escrowManager.connect(escrowAdmin).disburseFunds(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowSettled');
        eventArgs = events[0]?.args;

        const balanceOfAdminAfter = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfWorkerAfter = await ethers.provider.getBalance(worker.address);
        const balanceOfClientAfter = await ethers.provider.getBalance(client.address);
        
        expect(
            balanceOfAdminAfter.add(_escrowAmount) < balanceOfAdminBefore
        ).equal(true);

        expect(
            balanceOfWorkerBefore.add(_escrowAmount)
        ).equal(balanceOfWorkerAfter);

        expect(
            balanceOfClientBefore.eq(balanceOfClientAfter)
        ).equal(true);
    });

    it("disburseFunds() to client if dispute is in client favor", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement + "  2";

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, false);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);

        expect(eventArgs.votesNo.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesNo;
        expect(whoVoted).equal(voter.address);

        const _escrowAmount = eventArgs.amount;

        const balanceOfAdminBefore = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfClientBefore = await ethers.provider.getBalance(client.address);
        const balanceOfWorkerBefore = await ethers.provider.getBalance(worker.address);

        // admin disburses
        txn = await escrowManager.connect(escrowAdmin).disburseFunds(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowSettled');
        eventArgs = events[0]?.args;

        const balanceOfAdminAfter = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfClientAfter = await ethers.provider.getBalance(client.address);
        const balanceOfWorkerAfter = await ethers.provider.getBalance(worker.address);
        
        // take gas into account
        expect(
            (balanceOfAdminAfter.add(_escrowAmount)).lte(balanceOfAdminBefore)
        ).equal(true);

        expect(
            (balanceOfClientBefore.add(_escrowAmount)).eq(balanceOfClientAfter)
        ).equal(true);

        expect(
            balanceOfWorkerBefore.eq(balanceOfWorkerAfter)
        ).equal(true);
    });

    it("disburseFunds() should fail if not called by admin", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement + "  2";

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, false);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);

        expect(eventArgs.votesNo.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesNo;
        expect(whoVoted).equal(voter.address);

        // client disburses
         await expect(
			escrowManager.connect(client).disburseFunds(_escrowId)
		).to.be.revertedWith("Not Admin");

        // worker disburses
        await expect(
			escrowManager.connect(worker).disburseFunds(_escrowId)
		).to.be.revertedWith("Not Admin");
    });

    it("disburseFunds() should fail if dispute is not resolved", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement + "  2";

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // admin disburses
         await expect(
			escrowManager.connect(escrowAdmin).disburseFunds(_escrowId)
		).to.be.revertedWith("Escrow dispute not resolved!");
    });

    it("disburseFunds() should fail if escrow is already settled", async () => {
        let contractAmount = 250;
        let agreement = "Build a website";

        let txn, receipt, escrowId, _escrowId;
        let escrowsCreated = 0;

        // client creates escrow
        txn = await escrowManager.connect(client).createEscrow(worker.address, contractAmount, agreement, {value: contractAmount});
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowCreated');
        escrowId = events[0]?.args?.escrowId;
        _escrowId = await escrowManager.escrowIds(escrowsCreated);

        expect(escrowId).equal(_escrowId);


         // worker submits
        const work = agreement + "  2";

        txn = await escrowManager.connect(worker).submitWork(_escrowId, work);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkSubmitted');
        eventArgs = events[0]?.args;
        const submittedEscrowId = eventArgs.escrowId;
 
        expect(submittedEscrowId).equal(_escrowId);
 
        txn = await escrowManager.connect(worker).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.submission).equal(work);


        // client rejects
        txn = await escrowManager.connect(client).approveWork(false, _escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'WorkRejected');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        // voter votes
        txn = await escrowManager.connect(voter).voteForDispute(_escrowId, false);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'DisputeResolved');
        eventArgs = events[0]?.args;

        expect(eventArgs.escrowId).equal(_escrowId);

        txn = await escrowManager.connect(client).getEscrowDetails(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowDetails');
        eventArgs = events[0]?.args;
 
        expect(eventArgs.isDisputed).equal(false);

        expect(eventArgs.votesNo.length > 0).equal(true);

        const [whoVoted] = eventArgs.votesNo;
        expect(whoVoted).equal(voter.address);

        const _escrowAmount = eventArgs.amount;

        const balanceOfAdminBefore = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfClientBefore = await ethers.provider.getBalance(client.address);
        const balanceOfWorkerBefore = await ethers.provider.getBalance(worker.address);

        // admin disburses
        txn = await escrowManager.connect(escrowAdmin).disburseFunds(_escrowId);
        receipt = await txn.wait();
        events = await receipt.events?.filter((x) => x.event == 'EscrowSettled');
        eventArgs = events[0]?.args;

        const balanceOfAdminAfter = await ethers.provider.getBalance(escrowAdmin.address);
        const balanceOfClientAfter = await ethers.provider.getBalance(client.address);
        const balanceOfWorkerAfter = await ethers.provider.getBalance(worker.address);
        
        // take gas into account
        expect(
            (balanceOfAdminAfter.add(_escrowAmount)).lte(balanceOfAdminBefore)
        ).equal(true);

        expect(
            (balanceOfClientBefore.add(_escrowAmount)).eq(balanceOfClientAfter)
        ).equal(true);

        expect(
            balanceOfWorkerBefore.eq(balanceOfWorkerAfter)
        ).equal(true);


        // admin disburses again
        await expect(
			escrowManager.connect(escrowAdmin).disburseFunds(_escrowId)
		).to.be.revertedWith("Escrow already settled");
    });
});