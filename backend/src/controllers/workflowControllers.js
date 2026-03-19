//Trigger → AI Step → Condition → Action
//Workflow Builder APIs

const Workflow = require("../models/Workflow");

//create workflow
exports.createWorkflow = async (req, res) => {
    try {
        const workflow = await Workflow.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//GET ALL WORKFLOWs

exports.getWorkflows = async (req, res) => {
    try {
        const workflows = await Workflow.find({
            createdBy: req.user.id
        });


        res.json(workflows);
    }
    catch (error) {
        res.status(500).json({ error: error > message });
    }
};


// GET SINGLE WORKFLOW
exports.getWorkflow = async (req, res) => {

    try {

        const workflow = await Workflow.findById(req.params.id);

        res.json(workflow);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};

//update workflow
exports.updateWorkflow = async (req, res) => {
    try {
        const workflow = await Workflow.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(workflow);
    }
    catch (error) {

        res.status(500).json({ error: error.message });

    }

};

//delete workflow
exports.deleteWorkflow = async (req, res) => {
    try {
        await Workflow.findByIdAndDelete(req.params.id);
        res.json({ message: "Workflow deleted" });
    }
    catch (error) {

        res.status(500).json({ error: error.message });

    }
}
