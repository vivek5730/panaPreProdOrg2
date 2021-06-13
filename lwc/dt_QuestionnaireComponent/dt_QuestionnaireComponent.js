/*
Author  : Vivek S
Version : 1.0
Company : Marlabs LTD
*/

import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import SWEETALERT from "@salesforce/resourceUrl/VME_SweetAlert";

import { NavigationMixin } from 'lightning/navigation';     //FORCE EDIT RECORD 

import getQuestions from '@salesforce/apex/DT_BeginQuestionnaire.getQuestions';
import getNextQuestions from '@salesforce/apex/DT_BeginQuestionnaire.getnextQuestions';    //TO FETCH NEXT AND PREVIOUS QUE ANS
import submitUserAnswers from '@salesforce/apex/DT_BeginQuestionnaire.submitUserAnswers';  //TO SAVE USER INPUTS
import sendEmailNotification from '@salesforce/apex/DT_BeginQuestionnaire.sendEmailNotification';  //SEND EMAIL
import start from '@salesforce/apex/DT_BeginQuestionnaire.start';

import updateSurveyStatusHelper from '@salesforce/apex/DT_Digital_NPS_Handler.updateSurveyStatusHelper';


// Import custom labels
import standardObjSupportedForQuestionnaire from '@salesforce/label/c.DT_StandardObjSupportedForQuestionnaire';

export default class Dt_QuestionnaireComponent extends NavigationMixin(LightningElement) {
    label = {
        standardObjSupportedForQuestionnaire,
    };
    error;
    @track questions;

    @track options = [];
    answerForQuestion;

    typeOfOption;
    selectedValue;
    questionNo = 0;

    isEndOfPreviousQuestions = true;
    previous_Question;
    next_Question;
    questionId;

    isRadioButton = false;
    isPicklist = false;
    isEndOfNextQuestions = false;
    isfinishClicked = false;

    /*----DATATYPE----*/
    answerIsText = false;
    isNumber = false;
    isEmail = false;
    isDate = false;
    /*----DATATYPE----*/

    endTheService = false;

    value = '';//radioButton

    /*----METADATA(Header,Footer,BGColor)----*/
    customBgColor = 'white';
    headerContent = '';
    footerContent = '';
    passSelectedValue = '';
    hasFooter = false;
    finishTitleForSwal = '';
    /*----METADATA END----*/


    /*----MODAL FOR ACTIONS BEGIN----*/
    openEmailmodel = false;
    /*----EMAIL BEIGN----*/
    hasEmailFiles = false;
    isEmailAction = false;
    /*----EMAIL END----*/

    /*----LINK ACTION BEGIN----*/
    isLinkAction = false;
    displayLink = '';
    /*----LINK ACTION END----*/
    /*----MODAL FOR ACTIONS END----*/


    /*---------EMAIL ATTACHMENT-------*/
    @track fileName = '';
    @track UploadFile = 'Upload File';
    @track showLoadingSpinner = false;
    isTrue = false;
    filesUploaded = [];
    file;
    fileContents;
    fileReader;
    content;
    MAX_FILE_SIZE = 2500000;
    allFiles = [];
    encodedURIData;
    /*---------EMAIL ATTACHMENT-------*/

    /*----------GET RECORD ID-------*/
    @api objectApiName;
    @api recordId;
    @track currenObjectName;
    @track currenRecordId;

    //end Action
    objToCreateRecord;
    objToCreateRecordTypeId;

    isTreeConfigured = false;   //when no tree is configured in metadata
    //FIRST CALL
    connectedCallback() {
        this.connectedCallHelper();
    }

    callStartMethod = true;
    connectedCallHelper = async (event) => {
        if (this.callStartMethod == true && this.objectApiName != undefined) {
            await start({ sObjectName: this.objectApiName }).then(result => {
                if (result != null) {
                    if (result.status == 'TreeNotConfigured') {
                        this.isTreeConfigured = true;
                    } else {
                        this.isTreeConfigured = false;
                    }
                }
                if (this.isTreeConfigured == false) {
                    this.objToCreateRecord = result.dataSetConfi.DT_Object_to_create_record__c != null ? result.dataSetConfi.DT_Object_to_create_record__c : null;
                    this.objToCreateRecordTypeId = result.dataSetConfi.DT_Record_Type_Id__c != null ? result.dataSetConfi.DT_Record_Type_Id__c : null;
                }
            }).catch(error => {
                this.error = error;
                this.isTreeConfigured = true;
            })
            if (this.isTreeConfigured == false) {
                this.getQuestionHelper(null);
            }
        }
    }

    //NOTE: METHOD WILL BE CALLED FROM DIGITAL NPSLWC
    @api callFromDigitalNPS(workOrderId, decisionTreeIdFromNPS, languageSelectedByUser) {
        this.callStartMethod = false;
        this.isTreeConfigured = false;
        this.recordId = workOrderId;
        this.languageSelectedByUser = languageSelectedByUser;   //added on 11-March-2021
        this.getQuestionHelper(decisionTreeIdFromNPS);
    }

    getQuestionHelper = async (decisionTreeIdFromNPS, event) => {
        await getQuestions({ sObjectName: this.objectApiName, dTreeFromNPS: decisionTreeIdFromNPS, langSelected: this.languageSelectedByUser }).then(result => {
            //console.log('2nd::' + JSON.stringify(result));
            //if (result.queSet.Answers__r[0].DecisionWizard__Exclude_and_End__c == true) {
            if (result.status != undefined && result.status == 'End') {
                this.excludedResultHelper(result);
            }
            else {
                //console.log('currenRecordId' + this.recordId);
                this.metadataHelper(result)
                this.setAttributesHelper(result);

                let queNumber = this.questionNo + 1;
                this.questionNo = queNumber;
                this.isTreeConfigured = false;
            }
            //  console.log('-->' + JSON.stringify(result));
        }).catch(error => {
            this.error = error;
        })
    }

    /*----WHEN THERE IS NO SERVICE FOR THAT RECORD------*/
    excludedResultHelper(result) {
        this.endTheService = true;
        //this.swalHelper('No Service available!!', "No Service available.", 'warning', 'For More info contact your system admin.');
        this.isEndOfNextQuestions = true;
        // this.isEndOfPreviousQuestions = true;
        this.isfinishClicked = false;
    }
    //NEXT QUESTION AND FOR ITTERATIVE CALLS
    getNextQuestionOnClick = async (event) => {
        this.selectedValue = null;
        // this.passSelectedValue = null;
        await getNextQuestions({ currentQueId: this.questionId, queId: this.next_Question, userAnswer: this.passSelectedValue, langSelected: this.languageSelectedByUser }).then(result => {
            if (result != null) {
                // if (result.queSet.Answers__r != null && result.queSet.Answers__r[0].Exclude_and_End__c == true) {
                if (result.status != undefined && result.status == 'End') {
                    this.excludedResultHelper(result);
                }
                else {
                    let queNumber = this.questionNo + 1;
                    this.questionNo = queNumber;
                    /*  1.set attributes, 2.Next que, pre que etc., */
                    this.setAttributesHelper(result);
                }
                this.passSelectedValue = '';//added on 17-Dec to avoid issue occuring on date
            }
        })
            .catch(error => {
                //console.log('getNextQuestions' + JSON.stringify(error));
                this.error = error;
            })
    }

    //PREVIOUS QUESTION AND FOR ITTERATIVE CALLS
    getPrevQuestionOnClick = async (event) => {
        this.selectedValue = null;
        //this.clickedButtonLabel = event.target.label;
        //console.log("Go Next---->" + this.clickedButtonLabel);
        //DELETING PREVIOUS ANSWERS WHEN RETURNED BACK
        if (this.userQueAnsAnswers.length >= 1) {
            for (let i = 0; i < this.userQueAnsAnswers.length; i++) {
                if (this.questionId === this.userQueAnsAnswers[i].queId) {
                    // console.log('*************Duplicate************');
                    this.userQueAnsAnswers.splice(i, 1);    //REMOVE THE PREVIOUS ANSWER
                }
            }
        }
        await getNextQuestions({ queId: this.previous_Question }).then(result => {
            if (result != null) {
                this.setAttributesHelper(result);
                var queNumber = this.questionNo - 1;
                if (queNumber == 0) {
                    this.questionNo = 1;
                } else {
                    this.questionNo = queNumber;
                }
            }

        }).catch(error => {
            this.error = error;
            //console.log('error::' + JSON.stringify(error));
        })
    }

    showSubmitToast = true;
    isRemarks = false;
    setAttributesHelper(result) {
        this.currenRecordId = this.recordId;
        this.currenObjectName = this.objectApiName;

        this.questionId = result.queSet.Id;
        // this.questions = result.queSet.DT_Enter_your_Question__c; //commented on 11-March-21 Replaced by translated Lang
        this.questions = result.translatedQueName;//constains translated ques
        this.typeOfOption = result.queSet.DT_Answer_Display_Type__c.toLowerCase();
        this.answerForQuestion = result.queSet.DT_Answer_Options__c;
        if (result.queSet.DT_Answers__r != null && result.queSet.DT_Answers__r != undefined) {
            this.previous_Question = result.queSet.DT_Answers__r[0].DT_Previous_Question__c;
            this.next_Question = result.queSet.DT_Answers__r[0].DT_Next_Question__c;
        }

        //enable text for remarks
        if (this.questions.includes('0 means you will not recommend and 10 means')) {
            this.isRemarks = true;
        } else {
            this.isRemarks = false;
        }


        if (this.typeOfOption == 'radio' || this.typeOfOption == 'picklist') {
            this.radioPicklListHelper(result);
            this.optionsEnableDisableHelper(this.typeOfOption);
        }
        //Added on 27-Feb-2021
        if (this.typeOfOption == 'message') {
            this.radioPicklListHelper(null);
            this.swalHelper('Thanks for ur response!!', this.answerForQuestion, 'success', null);
            this.showSubmitToast = false;
            this.questionsfinished();
        }
        if (this.typeOfOption == 'text' || this.typeOfOption == 'number' || this.typeOfOption == 'email' || this.typeOfOption == 'date') {
            this.optionsEnableDisableHelper(this.typeOfOption);
        }
        this.checkPreviousQuestionHelper(this.previous_Question);   //checkPreviousQuestion to disable previous button
        this.isEmailActionHelper(result);   //checkFor any actions if exists
        this.checkIfEndOfQuestion(result);  //checkEndOfQuestion to disable next button
        //console.log('Previous_Question__c' + this.previous_Question);
        //console.log('next_Question-->' + this.next_Question);
    }

    optionsEnableDisableHelper(typeOfOption) {
        if (typeOfOption == 'radio') {
            this.isRadioButton = true;
            this.isPicklist = false;
            this.answerIsText = false;
            this.isNumber = false;
            this.isDate = false;
            this.isEmail = false;
        }
        if (typeOfOption == 'picklist') {
            this.isRadioButton = false;
            this.isPicklist = true;
            this.answerIsText = false;
            this.isNumber = false;
            this.isDate = false;
            this.isEmail = false;
        }
        if (typeOfOption == 'text') {
            this.answerIsText = true;
            this.isRadioButton = false;
            this.isPicklist = false;
            this.isNumber = false;
            this.isDate = false;
            this.isEmail = false;
        }
        if (typeOfOption == 'number') {
            this.isNumber = true;
            this.answerIsText = false;
            this.isRadioButton = false;
            this.isPicklist = false;
            this.isDate = false;
            this.isEmail = false;
        }
        if (typeOfOption == 'email') {
            this.isEmail = true;
            this.isNumber = false;
            this.answerIsText = false;
            this.isRadioButton = false;
            this.isPicklist = false;
            this.isDate = false;
        }
        if (typeOfOption == 'date') {
            this.isDate = true;
            this.isNumber = false;
            this.answerIsText = false;
            this.isRadioButton = false;
            this.isPicklist = false;
            this.isEmail = false;
        }
    }


    //-----------CHECK IF PREVIOUS QUESTIONS EXIST------
    checkPreviousQuestionHelper(previous_Question) {
        if (this.previous_Question != null || this.previous_Question != undefined) {
            this.isEndOfPreviousQuestions = false;
        } else {
            this.isEndOfPreviousQuestions = true;
        }
    }

    checkIfEndOfQuestion(result) {
        if (result.queSet.DT_Answers__r != null && (result.queSet.DT_Answers__r[0].DT_Is_End_of_Questions__c == true || (result.queSet.DT_Answers__r[0].DT_Next_Question__c == null || result.queSet.DT_Answers__r[0].DT_Next_Question__c == undefined))) {
            // console.log('EndOfQue?' + result.queSet.Answers__r[0].Is_End_of_Questions__c);
            this.isEndOfNextQuestions = true;
        } else {
            this.isEndOfNextQuestions = false;
        }
    }

    //----------END OF QUESTION ?-----------
    questionsfinished = async (event) => {
        let objectAPIName = '';
        await submitUserAnswers({ usersAnswer: JSON.stringify(this.userQueAnsAnswers), recordID: this.recordId, ratingRemarks: this.ratingRemarks }).then(result => {
            if (result != null) {
                if (!standardObjSupportedForQuestionnaire.includes(this.objToCreateRecord)) {
                    objectAPIName = this.objToCreateRecord + '__c';
                } else {
                    objectAPIName = this.objToCreateRecord;
                }
                if (this.objToCreateRecord != null) {
                    let objLabelToCreateRecord = '';
                    if (this.objToCreateRecord.includes('__c')) {
                        let splitValue = this.objToCreateRecord.split('__c', 3);
                        objLabelToCreateRecord = splitValue[0];
                    } else {
                        objLabelToCreateRecord = this.objToCreateRecord;
                    }
                    Swal.fire({
                        title: this.finishTitleForSwal,
                        text: 'Your input has been saved.',
                        type: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Do you want to create ' + objLabelToCreateRecord + ' record ?',
                        cancelButtonText: 'No, Thanks!',
                        cancelButtonColor: '#22bb33',
                        footer: null,
                    }).then((result) => {
                        if (result.value) {
                            if (this.objToCreateRecordTypeId != undefined && this.objToCreateRecordTypeId != null) {
                                this[NavigationMixin.Navigate]({
                                    type: 'standard__objectPage',
                                    attributes: {
                                        objectApiName: objectAPIName,
                                        actionName: 'new'
                                    },
                                    state: {
                                        nooverride: '1',
                                        //defaultFieldValues: "Name=Salesforce,AccountNumber=A1,AnnualRevenue=37000,Phone=7055617159"
                                        defaultFieldValues: "RecordTypeId=" + this.objToCreateRecordTypeId
                                    }
                                });
                            } else {
                                this[NavigationMixin.Navigate]({
                                    type: 'standard__objectPage',
                                    attributes: {
                                        objectApiName: objectAPIName,
                                        actionName: 'new'
                                    }
                                });
                            }
                        }
                        else if (result.dismiss == 'cancel') {
                            //console.log('dont createCase');
                        }
                    })
                } else {
                    if (this.showSubmitToast == true) {
                        this.swalHelper('Success!!', 'Response Saved!', 'success', null);
                    }
                }
                this.callChildComponent(result);  //27-Feb-2021
            }
        }).catch(error => {
            this.error = error;
        })
        //this.swalHelper('Thanks your for valuable input', "Thanks your for valuable input", 'success', null);
        this.isEndOfPreviousQuestions = true;
        this.isfinishClicked = true;
    }


    userQueAnsAnswers = [];
    customerProvidedRating = '';
    feedbackRefused = false;
    //--------RADIO BUTTON---------
    handleRadioChange(event) {


        if (this.questions.includes('0 means you will not recommend and 10 means') && ((this.ratingRemarks == null || this.ratingRemarks == undefined) || (this.ratingRemarks != null && this.ratingRemarks.length < 15))) {
            alert('Remarks must contains atleast 15 character');
        } else if (this.questions.includes('0 means you will not recommend and 10 means') && (this.ratingRemarks != null && this.ratingRemarks.length > 255)) {
            alert('Your remarks should be less than 255 characters');
        } else {
            this.isRadioButton = false;
            this.selectedValue = event.detail.value;

            this.storeResult(this.questionId, this.questions, this.selectedValue);
            if (this.questions.includes('0 means you will not recommend and 10 means')) {
                this.customerProvidedRating = event.detail.value;
                this.isRemarks = false;
                this.updateSurveyStatusHandler();
            }
            //if customer refuses to provide feedback then update the status
            if (((this.questions.toLowerCase().includes('please confirm if') &&
                this.questions.toLowerCase().includes('is serviced properly')) ||
                this.questions.toLowerCase().includes('been installed') ||
                this.questions.toLowerCase().includes('has provided you Demo') ||
                this.questions.toLowerCase().includes('is repaired')) && event.detail.value == 'No') {
                this.feedbackRefused = true;
            }
            this.passSelectedValue = this.selectedValue;
            //this.selectedValue = null;    //added on 03-March-2021
            this.getNextQuestionOnClick(event);
        }
    }
    //----------PICKLIST-------------
    handlePickListChange(event) {
        this.selectedValue = event.target.value;
        // console.log('SELECT PICKLIST VALUE IS:' + this.selectedValue);
        this.dispatchEvent(new CustomEvent('selected', { detail: event.target.value }));
        this.storeResult(this.questionId, this.questions, this.selectedValue);
        this.passSelectedValue = this.selectedValue;
        this.getNextQuestionOnClick(event);
    }

    //27-April-2021
    updateSurveyStatusHandler() {
        updateSurveyStatusHelper({ workOrderId: this.recordId, surveyStatus: 'Stage1' }).then(result => {
        }).catch(error => {
            this.error = error;
        })
    }

    //--------STORE THE VALUES OF TEXT FIELDS ---------
    handleTextChange(event) {
        this.selectedValue = '';
        this.passSelectedValue = '';
        let textInput = event.detail.value;
        this.storeResult(this.questionId, this.questions, textInput);
    }
    ratingRemarks = null;
    handleRemarksChange(event) {
        let remarks = event.detail.value;
        if (remarks != undefined && remarks.length == 15) {
            this.isRadioButton = false;
            this.ratingRemarks = remarks;
        } if (remarks != undefined && remarks.length > 15) {
            this.ratingRemarks = remarks;
        }
    }

    enableRadioAfterRemarkKeyUp(event) {
        if (this.ratingRemarks != undefined && this.ratingRemarks.length >= 15) {
            this.isRadioButton = true;
        }
    }

    //--------STORE THE VALUES OF NUMBER FIELDS ---------
    handleNumberChange(event) {
        this.passSelectedValue = '';
        this.selectedValue = '';
        let textNumber = event.detail.value;
        this.storeResult(this.questionId, this.questions, textNumber);
    }
    //--------STORE THE VALUES OF DATE FIELDS ---------
    handleDateChange(event) {
        this.selectedValue = '';
        this.passSelectedValue = '';
        //console.log('selected::' + this.passSelectedValue);
        let dateInput = event.detail.value;
        this.storeResult(this.questionId, this.questions, dateInput);
    }
    //--------STORE THE VALUES OF DATE FIELDS ---------
    handleEmailChange(event) {
        this.selectedValue = '';
        this.passSelectedValue = '';
        //console.log('selected::' + this.passSelectedValue);
        let emailInput = event.detail.value;
        this.storeResult(this.questionId, this.questions, emailInput);
    }

    //------------TO SEND THE SELECTED VALUES BACK AS 
    storeResult(questionId, questions, selectedValue) {
        if (this.userQueAnsAnswers.length >= 1) {
            for (let i = 0; i < this.userQueAnsAnswers.length; i++) {
                if (questionId === this.userQueAnsAnswers[i].queId) {
                    // console.log('*************Duplicate************');
                    this.userQueAnsAnswers.splice(i, 1);    //REMOVE THE PREVIOUS ANSWER
                }
            }
        }
        this.userQueAnsAnswers.push({
            queId: questionId,
            question: questions,
            userAnswer: selectedValue
        })
        this.showUserAnsweredResult();
        //console.log('userQueAnsAnswers2 ===> ' + JSON.stringify(this.userQueAnsAnswers));
        //console.log('userQueAnsAnswers length  ===> ' + this.userQueAnsAnswers.length);
    }


    //------------RADIO AND PICKLIST HELPER-----------
    radioPicklListHelper(result) {
        this.options = [];
        if (result != null) {
            let optionsValues = [];
            /*
            for (let i = 0; i < result.ansStringArray.length; i++) {
                optionsValues.push({
                    label: result.ansStringArray[i],
                    value: result.ansStringArray[i]
                })
            }*/
            for (let i = 0; i < result.translatedAnswerOptions.length; i++) {
                optionsValues.push({
                    label: result.translatedAnswerOptions[i],
                    value: result.translatedAnswerOptions[i]
                })
            }
            this.options = optionsValues;
        } else {
            this.options = null;
        }

    }


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

    /*SET HEADER, FOOTER AND BG COLOR */
    metadataHelper(result) {
        if (result.queMetadataSettings.DT_Header_Content__c != null || result.queMetadataSettings.DT_Header_Content__c != undefined) {
            this.headerContent = result.queMetadataSettings.DT_Header_Content__c;
        }
        if (result.queMetadataSettings.DT_Footer_Content__c != null || result.queMetadataSettings.DT_Footer_Content__c != undefined) {
            this.footerContent = result.queMetadataSettings.DT_Footer_Content__c;
            this.hasFooter = true;
        }
        if (result.queMetadataSettings.DT_Finish_Title_Message__c != null || result.queMetadataSettings.DT_Finish_Title_Message__c != undefined) {
            this.finishTitleForSwal = result.queMetadataSettings.DT_Finish_Title_Message__c;
        }
    }

    /*---------BEGIN EMAIL ACTION-----------------*/
    /*-----CLOSE EMAIL MODAL-----*/


    isEmailActionHelper(result) {
        if ((result.queSet.DT_Action_Config__c != undefined && result.queSet.DT_Action_Config__c != null) && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c != undefined && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c == 'Email and Link') {
            this.isEmailAction = true;
            this.isLinkAction = true;
            if (result.queSet.DT_Action_Config__r.DT_Provide_Link__c != undefined) {
                this.displayLink = result.queSet.DT_Action_Config__r.DT_Provide_Link__c;
            }

        }
        //ACTION TYPE: EMAIL
        else if ((result.queSet.DT_Action_Config__c != undefined && result.queSet.DT_Action_Config__c != null) && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c != undefined && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c == 'Email') {
            this.isEmailAction = true;
            this.isLinkAction = false;
        }
        //ACTION TYPE: LINK
        else if ((result.queSet.DT_Action_Config__c != undefined && result.queSet.DT_Action_Config__c != null) && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c != undefined && result.queSet.DT_Action_Config__r.DT_Type_of_Action__c == 'Link') {
            if (result.queSet.DT_Action_Config__r.DT_Provide_Link__c != null && result.queSet.DT_Action_Config__r.DT_Provide_Link__c != undefined) {
                this.isLinkAction = true;
                this.isEmailAction = false;
                this.displayLink = result.queSet.DT_Action_Config__r.DT_Provide_Link__c;

            }
        }
        else {
            this.isEmailAction = false;
            this.isLinkAction = false;
        }
    }
    openEmailModal(result) {
        this.openEmailmodel = true;
    }

    // getting file 
    /*-----ATTACHMENT-----*/

    handleFilesChange(event) {
        if (event.target.files.length > 0) {
            this.filesUploaded = event.target.files;
            this.fileName = event.target.files[0].name;
            const uploadedFiles = event.target.files;
            let multipleFiles = [];
            this.isTrue = false;//added on 21-Dec
            this.UploadFile = 'Upload File.'
            for (let i = 0; i < uploadedFiles.length; i++) {
                if (event.target.files[i].size > this.MAX_FILE_SIZE) {
                    alert('File Size is too long, Please select the file of size lesser than 2.5MB!!');
                    this.fileName = 'Please select another file.';
                    return;
                }
                this.file = this.filesUploaded[i];
                this.fileReader = new FileReader();
                this.fileReader.onloadend = (() => {
                    this.fileContents = this.fileReader.result;
                    let base64 = 'base64,';
                    this.content = this.fileContents.indexOf(base64) + base64.length;
                    this.fileContents = this.fileContents.substring(this.content);
                    this.encodedURIData = encodeURIComponent(this.fileContents)
                });
                this.fileReader.readAsDataURL(this.file);
                multipleFiles.push({
                    fileName: event.target.files[i].name,
                    fileType: event.target.files[i].type,
                    fileContents: this.encodedURIData
                })
            }
            this.allFiles = this.allFiles.concat(multipleFiles);
            this.hasEmailFiles = true;
            this.isTrue = false;
            this.UploadFile = 'Upload File!';
        }
        alert('Click on the Upload File Button to upload.');
    }
    handleSave() {
        if (this.allFiles.length > 0) {
            this.uploadHelper();
        } else {
            this.fileName = 'Please select file to upload!!';
        }
    }

    uploadHelper() {
        this.file = this.filesUploaded[0];
        //this.showLoadingSpinner = true; //spinner commented by vivek
        // create a FileReader object 
        this.fileReader = new FileReader();
        // set onload function of FileReader object  
        this.fileReader.onloadend = (() => {
            this.fileContents = this.fileReader.result;
            let base64 = 'base64,';
            this.content = this.fileContents.indexOf(base64) + base64.length;
            this.fileContents = this.fileContents.substring(this.content);
        });
        this.fileReader.readAsDataURL(this.file);
        this.UploadFile = 'File Uploaded Successfully';
        this.fileName = this.fileName + ' - Uploaded Successfully';
        this.isTrue = true;
    }
    saveToFile() {
        this.fileName = this.fileName + ' - Uploaded Successfully';
        this.UploadFile = 'File Uploaded Successfully';
        this.isTrue = true;
        this.showLoadingSpinner = false;

        // Showing Success message after file insert
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: this.file.name + ' - Uploaded Successfully!!!',
                variant: 'success',
            }),
        );
    }

    //deleteAttachmentFile
    deleteFileAttachment() {
        this.fileName = '';
        this.fileContents = '';
        this.file = '';
        this.isTrue = false;
        this.fileContents = '';
        this.content = '';
        this.hasEmailFiles = false;
    }

    sendEmailMethod() {
        let toAddress; let emailSubject; let emailBody;
        var inp = this.template.querySelectorAll("lightning-input");
        inp.forEach(function (element) {
            if (element.name == "enter-to-Address") {
                toAddress = element.value;
            } else if (element.name == "enter-subject") {
                emailSubject = element.value;
            }
        }, this);
        var inpTextarea = this.template.querySelectorAll("lightning-textarea");
        inpTextarea.forEach(function (element) {
            if (element.name == "mailBody") {
                emailBody = element.value;
            }
        }, this);
        if ((toAddress == undefined || toAddress == null) || emailSubject == undefined || emailBody == undefined) {
            alert('Please enter the required fields.');
        }

        if (toAddress != null && emailSubject != null && emailBody != null) {
            sendEmailNotification({ toAddress: toAddress, subject: emailSubject, body: emailBody, base64Data: encodeURIComponent(this.fileContents), fileContentType: this.file.type, fileName: this.fileName }).then(result => {
                if (result != null && result === true) {
                    this.swalHelper('Successfull', 'Mail Sent Successfully!', 'success', null);
                    this.hasEmailFiles = false;
                    this.fileName = '';
                    this.fileContents = '';
                    this.file.type = '';
                }
            }).catch(error => {
                this.error = error;
            })
            this.openEmailmodel = false; //close modal after mail is sent
        }
    }

    closeEmailModal() {
        this.openEmailmodel = false;
        this.hasEmailFiles = false;
        this.fileName = '';
        this.fileContents = '';
        this.file.type = '';
    }
    /*---------END EMAIL ACTION-----------------*/

    /*------------SWAL HELPER------------*/
    swalHelper(title, text, type, footer) {
        Swal.fire({
            title: title,
            text: text,
            type: type,
            footer: footer
        })
    }

    /*-----show results as what user as selected as answers-----*/
    hasUserAnswered = false;
    @track itemsArray = [];
    newQuestionItemsArray;
    showUserAnsweredResult() {
        if (this.userQueAnsAnswers.length >= 1) {
            this.hasUserAnswered = true;
            this.itemsArray = [];
            for (let i = 0; i < this.userQueAnsAnswers.length; i++) {
                this.itemsArray.push({
                    label: this.userQueAnsAnswers[i].question,
                    name: this.userQueAnsAnswers[i].question,
                    expanded: true,
                    items: [
                        {
                            label: this.userQueAnsAnswers[i].userAnswer,
                            name: this.userQueAnsAnswers[i].userAnswer,
                        },
                    ]
                })
            }
            this.newQuestionItemsArray = this.itemsArray;
        }
    }


    //27-Feb-2021
    callChildComponent(questResultId) {
        const event = new CustomEvent('answersubmit', {
            detail: {
                queResId: questResultId, customerAnsweredRating: this.customerProvidedRating,
                customerRefusedFeedback: this.feedbackRefused, customerRatingRemarksAnswer: this.ratingRemarks
            }
        });
        this.dispatchEvent(event);

    }
}