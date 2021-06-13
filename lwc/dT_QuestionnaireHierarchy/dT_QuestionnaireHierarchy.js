/*
Author  : Vivek S
Version : 1.0
Company : Marlabs LTD
*/

import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import SWEETALERT from "@salesforce/resourceUrl/VME_SweetAlert";

// Import custom labels
import standardObjSupportedForQuestionnaire from '@salesforce/label/c.DT_StandardObjSupportedForQuestionnaire';

/*--------BELOW IS FOR PICKLIST--------*/
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import QUESTION_OBJECT from '@salesforce/schema/DT_Question__c';   //GET OBJECT DESCRIPTION/SCHEMA
import Answer_Display_Type_FIELD from '@salesforce/schema/DT_Question__c.DT_Answer_Display_Type__c';  //GET PICKLIST VALUE

import DATASET_TREE_OBJECT from '@salesforce/schema/DT_DataSet_Configuration_Tree__c';
import Job_Classification_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Job_Classification__c';  //GET PICKLIST VALUE
/*--------ABOVE IS FOR PICKLIST--------*/

import submitQuestionAnswer from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.submitQuestionAnswer';
//import getTreeStructure from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.getTreeStructure';
import serachQues from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.serachQues'; //used for search

//to select the type of object user would like to create at the end
import getAllObjects from '@salesforce/apex/DT_selectObjToCreateRecordHelper.getAllObjects';
import getAllRecordTypes from '@salesforce/apex/DT_selectObjToCreateRecordHelper.getAllRecordTypes';
import insertDataSetTree from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.insertDataSetTree';

import groupTreeAsActiveAndInactive from '@salesforce/apex/DT_VersionHelper.groupTreeAsActiveAndInactive';


import displayDecisionTree from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.displayDecisionTree';
import deleteDecisionTree from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.deleteDecisionTree';
import getDecisionTreeVersions from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.getDecisionTreeVersions';

//FORCE EDIT RECORD 
import { NavigationMixin } from 'lightning/navigation';

//get status of tree on selection
import getSingleDecisionTreeToUpdate from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.getSingleDecisionTreeToUpdate';

//return recordTypeID
import getObjectRecordTypeId from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.getObjectRecordTypeId';

//return recordTypeID
import updateNewCorrectAnswer from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.updateNewCorrectAnswer';

//rename answers after mappign
import renameAnswers from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.renameAnswers';

//VERSIONING 
import cloneWhenTreeisActive from '@salesforce/apex/DT_VersionHelper.cloneWhenTreeisActive';

//ON ACTIVATING OF THE VER, OTHER VERSION SHOULD GET DISABLED 
import deactivateClonedVersions from '@salesforce/apex/DT_VersionHelper.deactivateClonedVersions';

import insertActionOnUpdate from '@salesforce/apex/DT_QuestionnaireHierarchyHelper2.insertActionOnUpdate';

//UI UPDATE FIELDS
import { updateRecord } from 'lightning/uiRecordApi';   //update record
import { getRecord } from 'lightning/uiRecordApi';  //get the field value
import { createRecord } from 'lightning/uiRecordApi';
import ACTION_CONFIG_OBJECT from '@salesforce/schema/DT_Action_Config__c';

import NAME_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.Name';
import DESCRIPTION_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Description__c';
import ACTIVE_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Active__c';
import OBJ2CREATE_RECORD_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Object_to_create_record__c';
import JOBCLASSIFICATION_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Job_Classification__c';
import OBJ_RECORDTYPE_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Record_Type_Id__c';
import ID_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.Id';

import ENTER_QUE_FIELD from '@salesforce/schema/DT_Question__c.DT_Enter_your_Question__c';
import QUE_ID_FIELD from '@salesforce/schema/DT_Question__c.Id';
import ANS_OPTIONS_FIELD from '@salesforce/schema/DT_Question__c.DT_Answer_Options__c';

import ACTION_CONFIG_ID_FIELD from '@salesforce/schema/DT_Action_Config__c.Id';
import URL_FIELD from '@salesforce/schema/DT_Action_Config__c.DT_Provide_Link__c';
import ACTIVATE_EMAIL_ADDR_FIELD from '@salesforce/schema/DT_Action_Config__c.DT_Activate_Email_Service__c';

/*const decisionTreeActiveFIELDS = ['DT_DataSet_Configuration_Tree__c.DT_Active__c'];*/

const searchcolumns = [
    {
        label: 'Name', fieldName: 'Name',
        sortable: true, initialWidth: 120, hideDefaultActions: "true"
        // editable: true,
    }, {
        label: 'Question', fieldName: 'DT_Enter_your_Question__c', wrapText: true, hideDefaultActions: "true"
        //or use clipText:true
    }, {
        label: 'Answer Options', fieldName: 'DT_Answer_Options__c', wrapText: true, hideDefaultActions: "true"
    }, {
        label: 'Action',
        type: "button", typeAttributes: {
            label: 'View',
            name: 'View',
            title: 'View',
            disabled: false,
            value: 'view',
            iconPosition: 'left'
        }
    },
];


//-------FOR DECISION TREE DATATABLE
const viewActions = [
    { label: 'Show details', name: 'show_details' },
    { label: 'Edit', name: 'edit_Tree' },
    { label: 'Delete', name: 'delete' },
    { label: 'Show Version', name: 'show_Version' },
];
const viewDecisionTreeTableColumns = [
    {
        label: 'Name', fieldName: 'Name',
        sortable: true,
        wrapText: true, hideDefaultActions: true
    }, {
        label: 'Record To Create', fieldName: 'DT_Object_to_create_record__c', wrapText: true, hideDefaultActions: true,
    }, {
        label: 'Active', fieldName: 'DT_Active__c', type: 'checkbox', clipText: true, hideDefaultActions: true
    },
    {
        type: 'action',
        typeAttributes: { rowActions: viewActions },
    },
];

//VERSION COLUMNS
const decisionTreeVersionTableColumns = [
    {
        label: 'Name', fieldName: 'Name',
        sortable: true,
    }, {
        label: 'Version Count', fieldName: 'DT_Version_Count__c'
    }, {
        label: 'Record To create', fieldName: 'DT_Object_to_create_record__c'
    }, {
        label: 'Active', fieldName: 'DT_Active__c', type: 'checkbox',
    }, {
        label: 'Parent Tree', fieldName: 'DT_Previous_DataSet_Configuration_Tree__r.Name',
    },
];



export default class DT_QuestionnaireHierarchy extends NavigationMixin(LightningElement) {
    showQuestion = false;
    isRadioPickList = false;

    questionInput;
    answerType;

    @track error;
    //treeRelated
    @track itemsArray = [];
    newQuestionItemsArray;
    setOfQueId = [];//store que id's in a set
    setOfQueIdsReturnedFromTree = [];
    questions;

    //subQuestionONCLICK
    previousAnswerID = '';

    //REGARDING THE PICKLIST
    @wire(getObjectInfo, { objectApiName: QUESTION_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: Answer_Display_Type_FIELD })
    AnswerDisplayTypeValues;

    //REGARDING THE PICKLIST
    @wire(getObjectInfo, { objectApiName: DATASET_TREE_OBJECT })
    datasetTreeObjectInfo;
    @wire(getPicklistValues, { recordTypeId: '$datasetTreeObjectInfo.data.defaultRecordTypeId', fieldApiName: Job_Classification_FIELD })
    JobClassificationValues;

    //DECISION TREE DATATABLE
    viewDecisionTreeTableColumns = viewDecisionTreeTableColumns;

    //DECISION TREE VERSION DATATABLE
    decisionTreeVersionTableColumns = decisionTreeVersionTableColumns;


    dataSetConfigName = ''; dataSetConfigDesc = ''; dataSetConfigActive = ''; dataSetConfigCreateRecObj = ''; dataSetConfigCreateRecObjRecordType = '';

    isLoading = false;   //spinner

    connectedCallback() {
        //load decisionTree table
        this.viewDecisionDataTableHelper();

    }
    viewActiveTreeDataTable;
    viewInActiveTreeDataTable;
    viewDecisionDataTableHelper = async (event) => {
        this.isLoading = true;
        await groupTreeAsActiveAndInactive().then(result => {
            this.isLoading = false;
            this.viewActiveTreeDataTable = result.activeDecisionTreeLst;
            this.viewInActiveTreeDataTable = result.inActiveDesicisonTreeLst;
        }).catch(error => {
            this.error = error;
        })
    }
    isEditDecisionTreeRecord = false;   //edit action
    decisionTableHandleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteDecisionTreeHelper(row.Id);
                break;
            case 'show_details':
                this.showDecisionTreeHelper(row.Id);
                this.decisionTreeID = row.Id;
                this.editDataSetRecord(row.Id);
                break;
            case 'edit_Tree':
                //this.editDecisionRecordHelper(row);
                this.isEditDecisionTreeRecord = true;
                this.editDataSetRecord(row.Id);
                this.showDecisionTreeHelper(row.Id);
                break;
            case 'show_Version':
                this.showVersionHandler(row.Id);
                break;
            default:
        }
    }


    showDecisionTreeHelper = async (row) => {
        await displayDecisionTree({ decisionTreeId: row }).then(result => {
            this.itemsArray = [];
            //console.log('size::' + result.items.length);
            this.decisionTreeID = row;
            this.itemsArray = result.items;
            this.newQuestionItemsArray = this.itemsArray;
            this.decisionTreeName = result.decisionTreeName;
            //version
            this.decisionTreeVersionCount = result.decisionTreeVersionCount;
            this.setOfQueIdsReturnedFromTree = result.treeQueIds;
            this.mapOfQuestion = result.qMap;
            this.decisionTreeID = row;
            if (result.items != undefined && result.items.length == 0) {
                this.enableAddingQueBtn = true;    //enable question add btn
            } else {
                this.enableAddingQueBtn = false;    //enable question add btn
            }
            this.previousAnswerID = '';
        }).catch(error => {
            this.error = error;
        })
    }

    deleteDecisionTreeHelper(row) {
        Swal.fire({
            title: 'Delete Operation',
            text: 'Do you really want to delete the tree ?',
            type: 'error',
            showCancelButton: true,
            confirmButtonColor: 'orangered',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No, Thanks!',
            cancelButtonColor: '#22bb33',
            footer: null,
        }).then((result) => {
            this.isLoading = true;
            if (result.value) {
                deleteDecisionTree({ decisionTreeId: row }).then(result => {
                    this.isLoading = false;
                    if (result == true) {
                        this.swalHelper('Success!!', 'Tree is deleted', 'success', null);
                        this.viewDecisionDataTableHelper();
                        this.showDecisionTreeHelper();//on delete clear the tree
                        this.disableDecisionTreeBtn = false;    //after deleting the tree enable btn to add tree
                        this.enableAddingQueBtn = false; //after deleting the tree disable btn to add question
                    } else if (result == false) {
                        this.swalHelper('Oops!!', 'Something went wrong', 'warning', null);
                    }
                }).catch(error => {
                    this.error = error;
                })
            }
            else if (result.dismiss == 'cancel') {
                this.isLoading = false;
                //console.log('dont delete');
            }
        })

    }
    editDecisionRecordHelper(row) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'DT_DataSet_Configuration_Tree__c',
                recordId: row.Id,
                actionName: 'edit'
            }
        });
        this.viewDecisionDataTableHelper();
    }
    /*-----------CLOSE EDIT MODAL------- */
    closeEditDecisionRecordModal() {
        this.isEditDecisionTreeRecord = false;
    }

    labelForActivate_DeactivateBtn = '';
    existingRecordType = [];
    hasexistingRecordType = false;
    dataSetJobClassification = '';
    editDataSetRecord = async (row) => {
        var result = '';
        await getSingleDecisionTreeToUpdate({ decisionTreeId: row }).then(returnResult => {
            result = returnResult;
        }).catch(error => {
            this.error = error;
        })
        if (result != null) {
            this.decisionTreeID = row;
            this.dataSetConfigName = result.Name;
            this.dataSetConfigDesc = result.DT_Description__c;
            this.dataSetConfigActive = result.DT_Active__c;
            this.dataSetJobClassification = result.DT_Job_Classification__c;

            this.setActivateDeActivLabelHelper();
            if (result.DT_Object_to_create_record__c != undefined) {
                this.dataSetConfigCreateRecObj = result.DT_Object_to_create_record__c;
                this.isToCreateRecord = true;
            }
            if (result.DT_Record_Type_Id__c != undefined) {
                this.dataSetConfigCreateRecObjRecordType = result.DT_Record_Type_Id__c;
                this.hasRecordTypes = true;
            }
            await getAllRecordTypes({ objName: result.DT_Object_to_create_record__c }).then(result => {
                if (result != null) {
                    this.existingRecordType = [];
                    var conts = result;
                    if (conts != undefined) {

                        for (var key in conts) {
                            if (conts[key] == this.dataSetConfigCreateRecObjRecordType) {
                                this.dataSetConfigCreateRecObjRecordType = key;
                                this.existingRecordType.push({ label: conts[key], value: key }); //Here we are creating the array to show on UI.
                            }
                        }
                    } if (this.existingRecordType.length > 0) {
                        this.hasexistingRecordType = true;
                    } else {
                        this.hasexistingRecordType = false;
                    }
                }
            }).catch(error => {
                this.error = error;
            })

            if (this.objectLabelOptions != undefined && this.objectLabelOptions.length == 0) {
                getAllObjects().then(result => {
                    this.objectPicklListHelper(result);
                })
            }
        }
        //add spinner here
    }

    setActivateDeActivLabelHelper() {
        if (this.dataSetConfigActive == true) {
            this.labelForActivate_DeactivateBtn = 'Deactivate';
        } else {
            this.labelForActivate_DeactivateBtn = 'Activate';
        }
    }


    handleEditJobClassificationPicklistChange(event) {
        this.editJobClassification = event.detail.value;
        console.log('dataSetJobClassification::' + this.dataSetJobClassification);
        console.log('>>' + event.detail.value);
    }

    //PURPOSE: TO UPDATE THE DATA TREE
    updateDataSetConfigRecord() {
        let isActiveChanged; let isNameChanged = ''; let isDescChanged = '';
        let isOnFinishCreateObjectChanged = this.dataSetConfigCreateRecObj != this.selectedObjectName ? this.selectedObjectName : this.dataSetConfigCreateRecObj;
        let isOnFinishCreateRecordTypeChanged = this.dataSetConfigCreateRecObjRecordType != this.selectedRecordTypeName ? this.selectedRecordTypeName : this.dataSetConfigCreateRecObjRecordType;
        let recordInput = {};
        var checkboxInput = this.template.querySelectorAll("lightning-input");
        checkboxInput.forEach(function (element) {
            if (element.name == "isUpdateDataSetActive") {
                if (this.dataSetConfigActive != element.checked)
                    isActiveChanged = element.checked;
            } else if (element.name == "isUpdateDataSetName") {
                if (this.dataSetConfigName != element.value)
                    isNameChanged = element.value;
            }
        }, this);

        var textAreaInputFields = this.template.querySelectorAll("lightning-textarea");
        textAreaInputFields.forEach(function (element) {
            if (element.name == "isUpdateDataSetDesc") {
                if (this.dataSetConfigDesc != element.value)
                    isDescChanged = element.value;
            }
        }, this);


        const fields = {};
        let isChanged = false;
        fields[ID_FIELD.fieldApiName] = this.decisionTreeID;
        if (isNameChanged != null && isNameChanged.length > 0) {
            fields[NAME_FIELD.fieldApiName] = isNameChanged;
            isChanged = true;
        }
        if (isActiveChanged != null) {
            fields[ACTIVE_FIELD.fieldApiName] = isActiveChanged;
            this.dataSetConfigActive = isActiveChanged;
            isChanged = true;
        }
        if (isDescChanged != null && isDescChanged.length > 0) {
            fields[DESCRIPTION_FIELD.fieldApiName] = isDescChanged;
            isChanged = true;
        }
        if (isOnFinishCreateObjectChanged != null) {
            fields[OBJ2CREATE_RECORD_FIELD.fieldApiName] = isOnFinishCreateObjectChanged;
            isChanged = true;
        }
        //jobclassification
        if (this.editJobClassification != null && this.editJobClassification != undefined && this.editJobClassification != this.dataSetJobClassification) {
            fields[JOBCLASSIFICATION_FIELD.fieldApiName] = this.editJobClassification;
            isChanged = true;
        }



        if (isChanged == true && isOnFinishCreateRecordTypeChanged != null) {
            getObjectRecordTypeId({ objToSave: isOnFinishCreateObjectChanged, recordTypeName: isOnFinishCreateRecordTypeChanged }).then(result => {
                if (standardObjSupportedForQuestionnaire.includes(isOnFinishCreateObjectChanged) && isOnFinishCreateRecordTypeChanged == 'Master') {
                    fields[OBJ_RECORDTYPE_FIELD.fieldApiName] = null;
                } else {
                    fields[OBJ_RECORDTYPE_FIELD.fieldApiName] = result;
                }

                recordInput = { fields };
                this.finalSumitToUpdateRecord(recordInput, 'DataSet Tree Updated', 'DataSetConfig');
            })
        } else if (isChanged == true) {
            this.isLoading = true;
            recordInput = { fields };
            this.finalSumitToUpdateRecord(recordInput, 'DataSet Tree Updated', 'DataSetConfig');
        }
    }


    /*BTN provided ui to call this method which inturn
     updates the Active field of dataSet Config Tree Record */
    activateDeactivateTreeRecord = async (event) => {
        let recordInput = {};
        let fields = {};

        fields[ID_FIELD.fieldApiName] = this.decisionTreeID;
        if (this.dataSetConfigActive == true) {
            Swal.fire({
                title: 'Update!',
                text: 'Do you want to deactivate the tree ?',
                type: 'error',
                showCancelButton: true,
                confirmButtonColor: 'orangered',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No, Thanks!',
                cancelButtonColor: '#696969',
                footer: null,
            }).then((result) => {
                // console.log(result.value);
                if (result.value) {
                    fields[ACTIVE_FIELD.fieldApiName] = false;
                    this.dataSetConfigActive = false;
                    recordInput = { fields };
                    this.finalSumitToUpdateRecord(recordInput, 'Tree Status changed.', 'DataSetConfigStatus');
                }
                else if (result.dismiss == 'cancel') {
                    //console.log('dont delete');
                }
            })
        } else if (this.dataSetConfigActive == false) {
            await deactivateClonedVersions({ decisionTreeID: this.decisionTreeID }).then(returnResult => {
                if (returnResult != null && returnResult === true) {
                    this.viewDecisionDataTableHelper();
                    this.dataSetConfigActive = true;
                    this.isEditDecisionTreeRecord = false;
                    this.setActivateDeActivLabelHelper();   //to change the activate deActivate label
                }
            })
        }

    }

    /*Used as helper method to update the record using uiRecord std functionality*/
    finalSumitToUpdateRecord(recordInput, toastMsg, objName) {
        //console.log('recordInput' + JSON.stringify(recordInput));
        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: toastMsg,
                        variant: 'success'
                    })
                );
                if (objName != null && objName == 'DataSetConfig') {
                    this.viewDecisionDataTableHelper();
                    this.isEditDecisionTreeRecord = false;
                    this.showDecisionTreeHelper(this.decisionTreeID);   //16-Dec-2020
                    //to change the activate deActivate label
                    this.isLoading = false;
                    setTimeout(this.setActivateDeActivLabelHelper(), 3000);
                } else if (objName != null && objName == 'Question' || objName == 'Edit Action') {
                    this.editQuestionAnswerModal = false;
                    this.showDecisionTreeHelper(this.decisionTreeID);
                } else if (objName != null && objName == 'DataSetConfigStatus') {
                    this.viewDecisionDataTableHelper();
                    this.isEditDecisionTreeRecord = false;
                    this.setActivateDeActivLabelHelper();   //to change the activate deActivate label
                }
            })
            .catch(error => {
                //   console.log(error);
            });
    }

    /*-----OPEN QUESTION MODAL-----*/
    openQueModal(event) {
        this.showQuestion = true;
    }
    /*-----CLOSE QUESTION MODAL-----*/
    closeQueModal() {
        this.isRadioPickList = false;
        this.showQuestion = false;
    }
    /*------GET PICKLIST VALUES------ */


    /*------GET PICKLIST VALUES------ */
    isMessage = false;
    handlePicklistChange(event) {
        this.answerType = event.detail.value;
        if (this.answerType == 'Radio' || this.answerType == 'Picklist') {
            this.isRadioPickList = true;
            this.isMessage = false;
        } if (this.answerType == 'Message') {
            this.isMessage = true;
            this.isRadioPickList = false;
        }
        if (this.answerType != 'Radio' && this.answerType != 'Picklist' && this.answerType != 'Message') {
            this.isRadioPickList = false;
            this.isMessage = false;
        }
    }
    handleSumbitQuestion(event) {
        let answerOptionsInput; let correctAnswersInput; let messageToDisplayInput;
        let excludeAndEnd = false; let endOfQuestion = false;
        let linkUrlInput; let inputActivateEmailService = false;
        var inp = this.template.querySelectorAll("lightning-textarea");
        inp.forEach(function (element) {
            if (element.name == "questionInput") {
                this.questionInput = element.value;
            } else if (element.name == "answerOptionsInput") {
                answerOptionsInput = element.value;
            } else if (element.name == "correctAnswersInput") {
                correctAnswersInput = element.value;
            } else if (element.name == "messageToDisplayInput") {
                messageToDisplayInput = element.value;
            }

        }, this);
        var checkboxInput = this.template.querySelectorAll("lightning-input");
        checkboxInput.forEach(function (element) {
            if (element.name == "inpActivateEmailService")
                inputActivateEmailService = element.checked;
            /* else if (element.name == "isExcludeAndEnd")
                excludeAndEnd = element.checked;
            else if (element.name == "isEndOfQuestion")
                 endOfQuestion = element.checked;*/
            else if (element.name == "linkUrlInput")
                linkUrlInput = element.value;
        }, this);

        let allRequiredFieldsPresent = true;
        if (this.questionInput == undefined) {
            alert('Enter the Question');
            allRequiredFieldsPresent = false;
        } else {
            allRequiredFieldsPresent = true;
        }
        if ((this.answerType == 'Radio' || this.answerType == 'Picklist') && (correctAnswersInput == undefined)) {
            alert('Please fill in the details.');
            allRequiredFieldsPresent = false;
        }
        if (linkUrlInput != '' && !linkUrlInput.includes('https://www.')) {
            alert('Please enter the url in the following \'https://www.google.com\' format!');
            allRequiredFieldsPresent = false;
        }
        if (this.answerType == 'Message') {
            correctAnswersInput = messageToDisplayInput;
        }
        if (allRequiredFieldsPresent) {
            submitQuestionAnswer({
                question: this.questionInput,
                answerDisplayType: this.answerType,
                //answerOpt: answerOptionsInput,    //ex: a; b; c; d is options and correct ans can be a; d
                answerOpt: correctAnswersInput,
                correctAnswer: correctAnswersInput,
                prevAnswerID: this.previousAnswerID,
                isActivateEmailService: inputActivateEmailService,
                urlLink: linkUrlInput,
                decisionTreeID: this.decisionTreeID
            }).then(result => {
                if (result.Id != null) {
                    this.isRadioPickList = false;
                    //ALL QUE IDS IN ARRAY TO STORE AND RETURN VALUES FOR TREE
                    this.swalHelper('ADDED SUCCESSFULLY!!', "Question & Answer added.", 'success', null);
                    this.closeQueModal();
                    this.setOfQueId.push({
                        queIds: result.Id
                    });
                    //this.handleTreeStructure(this.decisionTreeID); //UPDATE TREE  //replaced the method
                    this.showDecisionTreeHelper(this.decisionTreeID);
                }
                this.previousAnswerID = '';
            }).catch(error => {
                this.error = error;
            })
        }
    }

    editQuestionAnswerModal = false;
    editQuestionID = '';
    editQuestion = '';
    editAnswerType = '';
    editAnswerOptions = '';
    editCorrectAnswer = '';
    editURL = '';
    editIsActivateEmailService = false;
    editActionConfigID = '';

    //EDIT ON TREE VALUE / NODE SELECT
    handleOnTreeselect(event) {
        //console.log('selectedTreeItemValue:::: ' + event.detail.name);
        if (this.dataSetConfigActive) {
            Swal.fire({
                title: 'The Tree you\'re trying to edit is currently active.!',
                text: ' Do you still want to proceed by cloning ?',
                type: 'info',
                showCancelButton: true,
                confirmButtonColor: '#22bb33',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No, Thanks!',
                cancelButtonColor: 'orangered',
                footer: null,
            }).then((result) => {
                if (result.value) {
                    cloneWhenTreeisActive({ decisionTreeId: this.decisionTreeID }).then(result => {
                        if (result != null) {
                            this.viewDecisionDataTableHelper();
                            this.decisionTreeID = result;
                            //refresh the decisionTreeDatatable
                            this.showDecisionTreeHelper(this.decisionTreeID);
                            //FETCH THE TREE DETAILS
                            this.editDataSetRecord(this.decisionTreeID);
                        }
                    }).catch(error => {
                        //console.log('cloneWhenTreeisActive error::' + JSON.stringify(error));
                    })
                }
            })
        } else if (this.dataSetConfigActive == false) {
            if (this.setOfQueIdsReturnedFromTree.includes(event.detail.name)) {
                Swal.fire({
                    title: 'Update!',
                    text: 'Do you want to update ?',
                    type: 'info',
                    showCancelButton: true,
                    confirmButtonColor: 'orangered',
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No, Thanks!',
                    cancelButtonColor: '#22bb33',
                    footer: null,
                }).then((result) => {
                    if (result.value) {
                        this.editCorrectAnswer = '';    //set to null
                        this.editURL = '';
                        this.editAnswerOptions = '';
                        this.editIsActivateEmailService = false;
                        for (let key in this.mapOfQuestion) {
                            if (key == event.detail.name) {
                                this.editQuestionID = this.mapOfQuestion[key].Id;
                                this.editQuestion = this.mapOfQuestion[key].DT_Enter_your_Question__c;
                                this.editAnswerType = this.mapOfQuestion[key].DT_Answer_Display_Type__c;
                                this.editAnswerOptions = this.mapOfQuestion[key].DT_Answer_Options__c;
                                if (this.mapOfQuestion[key].DT_Action_Config__c != null && this.mapOfQuestion[key].DT_Action_Config__c != undefined) {
                                    this.editActionConfigID = this.mapOfQuestion[key].DT_Action_Config__r.Id != null ? this.mapOfQuestion[key].DT_Action_Config__r.Id : null;
                                    this.editURL = this.mapOfQuestion[key].DT_Action_Config__r.DT_Provide_Link__c != null ? this.mapOfQuestion[key].DT_Action_Config__r.DT_Provide_Link__c : null;
                                    this.editIsActivateEmailService = this.mapOfQuestion[key].DT_Action_Config__r.DT_Activate_Email_Service__c != null ? this.mapOfQuestion[key].DT_Action_Config__r.DT_Activate_Email_Service__c : null;
                                }
                                if (this.mapOfQuestion[key].DT_Answers__r != null && this.mapOfQuestion[key].DT_Answers__r != undefined && this.mapOfQuestion[key].DT_Answers__r.length > 0) {
                                    for (let j = 0; j < this.mapOfQuestion[key].DT_Answers__r.length; j++) {
                                        this.editCorrectAnswer += this.mapOfQuestion[key].DT_Answers__r[j].DT_Correct_Answer__c;
                                        if (j != this.mapOfQuestion[key].DT_Answers__r.length - 1) {
                                            this.editCorrectAnswer += '; ';
                                        }
                                    }
                                }
                            }
                        }
                        this.editQuestionAnswerModal = true;
                        this.showQuestion = false;
                    }
                    else if (result.dismiss == 'cancel') {
                        // console.log('dont delete');
                    }
                })
            } else {
                this.previousAnswerID = event.detail.name;
                this.editQuestionAnswerModal = false;
                this.showQuestion = true;
            }
        }

        //console.log('selectedTreeItemValueID:: ' + event.detail.label);
    }
    updateQuestionAnswerHandler = async (event) => {
        let isQuestionChanged = ''; let isAnswerOptionsChanged = ''; let isCorrectAnswerChanged = '';
        let isLinkUrlChanged = ''; let isActivateEmailServiceChanged = false;
        let isAnswerChangedBoolean = false;
        var textAreaInputFields = this.template.querySelectorAll("lightning-textarea");
        textAreaInputFields.forEach(function (element) {
            if (element.name == "editQuestion") {
                if (this.editQuestion != element.value)
                    isQuestionChanged = element.value;
            } /*else if (element.name == "editAnswerOptions") {
            if (this.editAnswerOptions != element.value)
                isAnswerOptionsChanged = element.value;
        } */else if (element.name == "editCorrectAnswer") {
                if (this.editCorrectAnswer != element.value) {
                    isCorrectAnswerChanged = element.value;
                    isAnswerChangedBoolean = true;
                }

            }
        }, this);
        isAnswerOptionsChanged = this.editAnswerOptions;

        /***********ACTION *************/
        let linkUpdated = false;
        var inputFields = this.template.querySelectorAll("lightning-input");
        inputFields.forEach(function (element) {
            if (element.name == "editURL") {
                if (this.editURL != element.value) {
                    isLinkUrlChanged = element.value;
                    linkUpdated = true;
                }
            } else if (element.name == "editIsActivateEmailService") {
                if (this.editIsActivateEmailService != element.checked) {
                    isActivateEmailServiceChanged = element.checked;
                } else {
                    isActivateEmailServiceChanged = this.editIsActivateEmailService;
                }
            }
        }, this);
        /*----------------UI EDIT START-------------------*/
        //QUESTION UPDATE
        let fields = {};
        let recordInput = {};
        let isChanged = false;
        fields[QUE_ID_FIELD.fieldApiName] = this.editQuestionID;
        if (isQuestionChanged != null && isQuestionChanged.length > 0) {
            fields[ENTER_QUE_FIELD.fieldApiName] = isQuestionChanged;
            isChanged = true;
        }
        if (isCorrectAnswerChanged != null && isCorrectAnswerChanged.length > 0) {
            fields[ANS_OPTIONS_FIELD.fieldApiName] = isCorrectAnswerChanged;
        }
        let linkValidation = true;
        if ((isLinkUrlChanged != '') && !isLinkUrlChanged.includes('https://www.')) {
            alert('Please enter the url in the following \'https://www.google.com\' format!');
            linkValidation = false;
        } else {
            linkValidation = true;
        }

        recordInput = { fields };
        if (recordInput != null && isChanged == true && linkValidation == true) {
            this.finalSumitToUpdateRecord(recordInput, 'Question Update Successful', 'Question');
            this.editQuestionAnswerModal = false;
        }
        /*----------------UI EDIT END-------------------*/
        //ACTION UPDATE
        isChanged = false;
        fields = {};
        recordInput = {};

        if (this.editActionConfigID != null) {
            fields[ACTION_CONFIG_ID_FIELD.fieldApiName] = this.editActionConfigID;
            if (isLinkUrlChanged != null && isLinkUrlChanged.length > 0 && linkUpdated == true) {
                fields[URL_FIELD.fieldApiName] = isLinkUrlChanged;
                isChanged = true;
            } else if (linkUpdated == true) {
                fields[URL_FIELD.fieldApiName] = null;
                isChanged = true;
                linkUpdated = false;
            }
            if (isActivateEmailServiceChanged != null) {
                isChanged = true;
                fields[ACTIVATE_EMAIL_ADDR_FIELD.fieldApiName] = isActivateEmailServiceChanged;
            }
            recordInput = { fields };
            if (this.editActionConfigID != '') {
                if (recordInput != null && isChanged == true && linkValidation == true) {
                    this.finalSumitToUpdateRecord(recordInput, 'Action Updated.', 'Edit Action');
                    this.editQuestionAnswerModal = false;
                }
            } else {
                if (isChanged == true && linkValidation == true) {
                    await insertActionOnUpdate({ questionID: this.editQuestionID, urlLink: isLinkUrlChanged, isActivateEmailService: isActivateEmailServiceChanged }).then(result => {
                        if (result == true) {
                            this.swalHelper('Successfully Added', 'Action Added', 'success', null);
                            this.editQuestionAnswerModal = false;
                        }
                    }).catch(error => {
                        this.error = error;
                    })
                }
            }
        }
        if (isCorrectAnswerChanged == null || isCorrectAnswerChanged.length == 0 && isAnswerChangedBoolean == true) {
            isCorrectAnswerChanged = this.editCorrectAnswer;
            //console.log('isCorrectAnswerChanged' + isCorrectAnswerChanged);
        }
        //ANSWER UPDATE

        var textAreaInputFields2 = this.template.querySelectorAll("lightning-textarea");
        textAreaInputFields2.forEach(function (element) {
            if (element.name == "editAnswerOptions") {
                this.editCorrectAnswer = element.value;
            }
        }, this);
        if (isCorrectAnswerChanged != null && isCorrectAnswerChanged != undefined) {
            await updateNewCorrectAnswer({ treeID: this.decisionTreeID, queId: this.editQuestionID, prevCorrectAnswerOptions: this.editCorrectAnswer, correctAnswer: isCorrectAnswerChanged }).then(result => {
                if (result == true) {
                    this.cancelUpdateQuestionAnswer();
                }
            })

        }

        //this.editQuestionAnswerModal = false;
        //call the tree with updated values
        this.showDecisionTreeHelper(this.decisionTreeID);
    }

    //-----------CLOSE UPDATE MODAL------------
    cancelUpdateQuestionAnswer() {
        this.editQuestionAnswerModal = false;
    }

    mapOfQuestion = '';

    /*-----------------SEARCH MODAL BEGIN---------------*/
    //ON KEY PRESS OF ENTER IN SEARCH
    handleSearchKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.handleSearch(evt);
        }
    }
    searchQueInput;
    searchData;
    searchcolumns = searchcolumns;
    errorMsg = '';
    searchResult = false;
    noResultFound = false;
    handleSearch(event) {
        this.isLoading = true;
        var inp = this.template.querySelectorAll("lightning-input");
        inp.forEach(function (element) {
            if (element.name == "enter-search") {
                this.searchQueInput = element.value;
                //console.log('To Search::' + this.searchQueInput);
            }
        }, this);
        if (!this.searchQueInput) {
            this.errorMsg = 'Please enter account name to search.';
            this.searchData = undefined;
            return;
        }
        serachQues({ strQueName: this.searchQueInput })
            .then(result => {
                this.isLoading = false;
                if (result != null) {
                    this.searchData = result;
                    if (this.searchData.length > 0) {
                        this.searchResult = true;
                        this.noResultFound = false;
                    }
                }
                /*result.forEach((record) => {
                    record.Id = '/' + record.Id;
                });*/
            })
            .catch(error => {
                this.isLoading = false;
                this.searchData = undefined;
                if (error) {
                    this.searchResult = true;
                    this.noResultFound = true;
                }
            })
    }
    closeSearchModal(event) {
        this.searchResult = false;
    }
    /*----------SEARCH KEY END---------*/

    /*-------------------CREATE DECISION TREE MODAL---------------------*/
    @track objectLabelOptions = [];
    isCreateDecisionTree = false;
    isToCreateRecord = false;

    openDecisionTreeModal() {

        getAllObjects().then(result => {
            this.objectPicklListHelper(result);
        }).catch(error => {
            this.error = error;
        })
        this.isCreateDecisionTree = true;

    }
    objectPicklListHelper(result) {
        let optionsValues = [];
        this.isToCreateRecord = true;
        for (let i = 0; i < result.length; i++) {
            optionsValues.push({
                label: result[i],
                value: result[i]
            })
        }
        this.objectLabelOptions = optionsValues;
    }
    @track mapData = [];
    hasRecordTypes = false;
    selectedObjectName = null;
    handleObjectChange(event) {
        this.hasRecordTypes = false;
        this.selectedObjectName = event.target.value;
        if (this.selectedObjectName != undefined && this.selectedObjectName != 'Select') {
            getAllRecordTypes({ objName: this.selectedObjectName }).then(result => {
                this.mapData = [];
                var conts = result;
                if (conts == null || conts == undefined) {
                    alert('The object you\'ve selected has not no RecordType!');
                } else {
                    for (var key in conts) {
                        this.mapData.push({ label: conts[key], value: key }); //Here we are creating the array to show on UI.
                    }
                }
                if (this.mapData.length > 0) {
                    this.hasRecordTypes = true;
                    this.hasexistingRecordType = false;
                } else {
                    this.hasRecordTypes = false;
                }
            }).catch(error => {
                this.error = error;
            })
        } else {
            this.selectedObjectName = '';
        }
    }
    closeDecisionTreeModal() {
        this.isCreateDecisionTree = false;
    }
    /*------ON SELECT OF RECORD TYPE---------*/
    selectedRecordTypeName = null;
    handleSelectedRecordType(event) {
        this.selectedRecordTypeName = event.target.value;
    }

    disableDecisionTreeBtn = false; //disable btn after adding the treeName
    enableAddingQueBtn = true;
    decisionTreeID;
    decisionTreeName;
    decisionTreeVersionCount;
    //CREATE DECISION TREE
    handleCreateDecisionTree = async (event) => {
        var inp = this.template.querySelectorAll("lightning-input");
        let dataSetTreeNameInput; let dataSetTreeDesc;
        inp.forEach(function (element) {
            if (element.name == "decisionTreeName") {
                dataSetTreeNameInput = element.value;
            } /*if (element.name == "decisionTreeDescription") {
            dataSetTreeDesc = element.value;
        }*/
        }, this);
        var textAreaInputFields = this.template.querySelectorAll("lightning-textarea");
        textAreaInputFields.forEach(function (element) {
            if (element.name == "decisionTreeDescription") {
                dataSetTreeDesc = element.value;
            }
        }, this);


        if (dataSetTreeNameInput == undefined || dataSetTreeNameInput == null || dataSetTreeNameInput == '') {
            alert('Please Enter the name.');
        }
        else if (this.jobClassification == null || this.jobClassification == undefined) {
            alert('Please select Job Classification');
        }
        else if (this.hasRecordTypes == true && this.selectedObjectName != null && this.selectedRecordTypeName == null) {
            alert('Please, select record type(If no record type exist select \'Master\'.');
        }

        else {
            var result = '';
            await insertDataSetTree({ name: dataSetTreeNameInput, descr: dataSetTreeDesc, objToSave: this.selectedObjectName, recordTypeName: this.selectedRecordTypeName, job_Classification: this.jobClassification, prdtGrpMstr: this.productGrpMasterId }).then(returnedResult => {
                result = returnedResult;
            }).catch(error => {
                this.error = error;
            })
            if (result.Id != undefined && result.Id.length >= 15) {
                this.decisionTreeID = result.Id;
                this.decisionTreeName = result.Name;
                this.closeDecisionTreeModal();
                this.swalHelper('Successfully Added', 'Tree Added', 'success', null);
                this.disableDecisionTreeBtn = true;
                this.enableAddingQueBtn = true;     //show add question btn
                this.viewDecisionDataTableHelper();
                this.showDecisionTreeHelper(this.decisionTreeID);
                this.editDataSetRecord(this.decisionTreeID);
            }
        }
    }

    /**********---------------ANSWER MAPPING---------------------**************/
    openAnswerMapModal = false;
    newlyAddedAnswer = '';  //to update on the question
    openAnswerMappingModalHandler() {
        this.openAnswerMapModal = true;

        let existingAnswers = ''; let newlyAddedAnswer = '';
        var textAreaInputFields = this.template.querySelectorAll("lightning-textarea");
        textAreaInputFields.forEach(function (element) {
            if (element.name == "editAnswerOptions") {
                existingAnswers = element.value;
            }
            else if (element.name == "editCorrectAnswer") {
                newlyAddedAnswer = element.value;
            }
        }, this);
        this.newlyAddedAnswer = newlyAddedAnswer;
        this.radioPicklListHelper(existingAnswers.split('; '), 'Existing');
        this.radioPicklListHelper(existingAnswers.split('; '), 'OnlyExisting');
        this.radioPicklListHelper(newlyAddedAnswer.split('; '), 'New');
    }

    closeAnswerMappingModalHandler() {
        this.openAnswerMapModal = false;
        this.enableMapAnsBtn = false;
        this.answersToBeRenamed = [];
    }
    @track newlyEnteredOptions = [];
    @track OldValueNewValueOptions = [];        //contains old and new
    radioPicklListHelper(result, type) {
        let optionsValues = [];
        if (type == 'OnlyExisting') {
            for (let i = 0; i < result.length; i++) {
                optionsValues.push({
                    oldValues: result[i],
                    newValues: ''
                })
            }
        } else {
            for (let i = 0; i < result.length; i++) {
                optionsValues.push({
                    label: result[i],
                    value: result[i]
                })
            }
        }

        if (type == 'OnlyExisting') {
            this.OldValueNewValueOptions = optionsValues;
            // console.log('OldValueNewValueOptions ===> ' + JSON.stringify(this.OldValueNewValueOptions));
        } else if (type == 'New') {
            this.newlyEnteredOptions = optionsValues;
            // console.log('newlyEnteredOptions ===> ' + JSON.stringify(this.newlyEnteredOptions));
        }
    }

    answersToBeRenamed = [];    //new array where values will be stored in to update the answers
    newValueSelected = async (event) => {
        let newlyMappedValue = event.target.value;
        var OldValueIndex = event.target.dataset.id;        //used as index
        for (let i = 0; i < this.OldValueNewValueOptions.length; i++) {
            if (this.OldValueNewValueOptions[i].oldValues === OldValueIndex) {
                this.OldValueNewValueOptions[i].newValues = event.target.value;
            }
        }
        for (let i = 0; i < this.answersToBeRenamed.length; i++) {
            if (OldValueIndex === this.answersToBeRenamed[i].oldAnswer) {
                //  console.log('*************Duplicate************');
                this.answersToBeRenamed.splice(i, 1);    //REMOVE THE PREVIOUS ANSWER
            }
        }


        for (var key in this.mapOfQuestion) {
            //answer!=null
            if (key === this.editQuestionID && this.mapOfQuestion[key].DT_Answers__r != null) {
                //iterate answer
                for (var ans in this.mapOfQuestion[key].DT_Answers__r) {
                    if (this.mapOfQuestion[key].DT_Answers__r[ans].DT_Correct_Answer__c === OldValueIndex) {
                        this.answersToBeRenamed.push({
                            ansID: this.mapOfQuestion[key].DT_Answers__r[ans].Id,
                            queID: this.mapOfQuestion[key].DT_Answers__r[ans].DT_Question__c,
                            treeID: this.decisionTreeID,
                            newAnswer: newlyMappedValue,
                            oldAnswer: OldValueIndex,
                            newlyAddedListOfAnswers: this.editCorrectAnswer.replace(OldValueIndex, newlyMappedValue)
                        });
                        this.editAnswerOptions = this.editAnswerOptions.replace(OldValueIndex, newlyMappedValue)
                    }
                }
            }
        }
    }

    //enable Map Ans btn
    enableMapAnsBtn = false
    enableMapAnsOnChangeHandler(event) {
        if (this.dataSetConfigActive == false) {
            this.enableMapAnsBtn = true;
        }
    }
    //rename
    renameAnswerHandler = async (event) => {
        await renameAnswers({ ansToBeRenamed: JSON.stringify(this.answersToBeRenamed) }).then(result => {
            if (result != null && result === true) {
                this.swalHelper('Success', 'Renamed Successfully', 'success', null);
                this.showDecisionTreeHelper(this.decisionTreeID);
                this.openAnswerMapModal = false;
                this.answersToBeRenamed = [];
                this.editQuestionAnswerModal = false;   //added on 24-Feb to close the edit option
            } else if (result != null && result === false) {
                this.swalHelper('Error!', 'Oops, Something went wrong!', 'error', null);
            }
        }).catch(error => {
        })
    }

    /*------------------------SHOW VERSION BEGIN---------------------------*/
    showVersionModal = false;
    decisionTreeVersionDataTable = '';
    decisionTreeVersionName = '';
    hasVersions = false;
    closeVersionModal() {
        this.showVersionModal = false;
    }
    showVersionHandler(rowID) {
        this.showVersionModal = true;
        getDecisionTreeVersions({ decisionTreeId: rowID }).then(result => {
            if (result != null) {
                if (result.dataSetConfigList.length == 0) {
                    this.hasVersions = true;
                    this.decisionTreeVersionDataTable = null;

                } else {
                    this.decisionTreeVersionDataTable = result.dataSetConfigList;
                    this.decisionTreeVersionName = result.treeName;
                    this.hasVersions = false;
                }
            }

        }).catch(error => {
            this.error = error;
        })
    }
    displayVersionOnUIHandler(event) {
        let targetId = event.target.dataset.targetId;
        this.showDecisionTreeHelper(targetId);
        this.decisionTreeID = targetId;
        this.editDataSetRecord(targetId);
        this.closeVersionModal();
    }

    deleteVersionOnUIHandler(event) {
        let treeToDelete = event.target.dataset.targetId;
        this.deleteDecisionTreeHelper(treeToDelete);
        this.closeVersionModal();
    }
    editVersionOnUIHandler(event) {
        let treeToDelete = event.target.dataset.targetId;
        this.closeVersionModal();
        this.isEditDecisionTreeRecord = true;
        this.editDataSetRecord(treeToDelete);
    }


    /*------------LOAD SCRIPT FOR SWAL-----------------*/
    renderedCallback() {
        Promise.all([loadScript(this, SWEETALERT)]).then(() => { }).catch(
            error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error loading D3',
                    message: error.message,
                    variant: 'error'
                }));
            });
    }
    /*------------SWAL HELPER------------*/
    swalHelper(title, text, type, footer) {
        Swal.fire({
            title: title,
            text: text,
            type: type,
            footer: footer
        })
    }

    callRowAction(event) {
        const recId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if (actionName != null && actionName === 'View') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recId,
                    objectApiName: 'DT_Question__c', // objectApiName is optional
                    actionName: 'view'
                }
            });
        }


    }

    onProdcutSelection = async (event) => {
        this.productGrpMasterId = event.detail.selectedRecordId;
    }
    jobClassification = '';
    handleJobClassificationPicklistChange(event) {
        this.jobClassification = event.detail.value;
    }
}