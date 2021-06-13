/*
Created By      : Vivek S
Company         : Marlabs Pvt Ltd
LastModifed on  : 03-MARCH-2021
LastModifed By  : Vivek S
Referred In     : PI_DigitalNPS_App(Application),DT_DigitalNPS_VF
*/

import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import SWEETALERT from "@salesforce/resourceUrl/VME_SweetAlert";

// Import custom labels
import NPS_CallCenterExperienceLabel from '@salesforce/label/c.NPS_CallCenterExperience';
import NPS_CostOfServiceLabel from '@salesforce/label/c.NPS_CostOfService';
import NPS_ProductExperienceLabel from '@salesforce/label/c.NPS_ProductExperience';
import NPS_QualityOfServiceLabel from '@salesforce/label/c.NPS_QualityOfService';
import NPS_SpeedOfServiceLabel from '@salesforce/label/c.NPS_SpeedOfService';

import NPS_Disclaimer from '@salesforce/label/c.NPS_Disclaimer';


/*--------BELOW IS FOR PICKLIST--------*/
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import DATASET_TREE_OBJECT from '@salesforce/schema/DT_DataSet_Configuration_Tree__c';   //GET OBJECT DESCRIPTION/SCHEMA
import LANGUAGE_FIELD from '@salesforce/schema/DT_DataSet_Configuration_Tree__c.DT_Language__c';  //GET PICKLIST VALUE
/*--------ABOVE IS FOR PICKLIST--------*/

//load workorder details
import getWorkOrderDetails from '@salesforce/apex/DT_Digital_NPS_Handler.getWorkOrderDetails';
//GET DECISION TREE BASED ON LANGUAGE
import getDecisionTreeBasedOnUserInput from '@salesforce/apex/DT_Digital_NPS_Handler.getDecisionTreeBasedOnUserInput';
//GET ADDITIONAL DRIVER OPTIONS
import getDriverOptions from '@salesforce/apex/DT_Digital_NPS_Handler.getDriverOptions';
//SUBMIT ADDITIONAL DRIVER
import submitDriverOptions from '@salesforce/apex/DT_Digital_NPS_Handler.submitDriverOptions';

//TO UPDATE THE FIELD ON WORKORDER ONCE THE FEEDBACK IS SUBMITTED
import updateWorkOrderAsSubmitted from '@salesforce/apex/DT_Digital_NPS_Handler.updateWorkOrderAsSubmitted';
import updateWorkOrderStatusOnRefuse from '@salesforce/apex/DT_Digital_NPS_Handler.updateWorkOrderStatusOnRefuse';



//send SMS
import sendSMSBasedOnRating from '@salesforce/apex/DT_Digital_NPS_Handler.sendSMSBasedOnRating';
import sendEmailOnDetractor from '@salesforce/apex/DT_Digital_NPS_Handler.sendEmailOnDetractor';
import updateSurveyStatusHelper from '@salesforce/apex/DT_Digital_NPS_Handler.updateSurveyStatusHelper';
import getUIThemeDescription from '@salesforce/apex/DT_Digital_NPS_Handler.getUIThemeDescription';

//STATIC RESOURCE
import BACKGROUND_IMG from '@salesforce/resourceUrl/PI_PanasonicLogoBackground';
import DT_CallCenterIcon from '@salesforce/resourceUrl/DT_CallCenterIcon';
import DT_CostOfServiceIcon from '@salesforce/resourceUrl/DT_CostOfServiceIcon';
import DT_DropBoxIcon from '@salesforce/resourceUrl/DT_DropBoxIcon';
import DT_SpeedOfServiceIcon from '@salesforce/resourceUrl/DT_SpeedOfServiceIcon';
import DT_QualityOfServiceIcon from '@salesforce/resourceUrl/DT_QualityOfServiceIcon';

export default class Pi_DigitalNPS_LWC extends NavigationMixin(LightningElement) {
    //DRIVER ICONS
    DT_CallCenterIconImg = DT_CallCenterIcon;
    DT_CostOfServiceIconImg = DT_CostOfServiceIcon;
    DT_DropBoxIconImg = DT_DropBoxIcon;
    DT_SpeedOfServiceIconImg = DT_SpeedOfServiceIcon;
    DT_QualityOfServiceIconImg = DT_QualityOfServiceIcon;

    //REGARDING THE PICKLIST
    @wire(getObjectInfo, { objectApiName: DATASET_TREE_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: LANGUAGE_FIELD })
    LanguageTypeValues;

    //CUSTOM LABELS
    NPS_CallCenterExperienceLabel = NPS_CallCenterExperienceLabel;
    NPS_CostOfServiceLabel = NPS_CostOfServiceLabel;
    NPS_ProductExperienceLabel = NPS_ProductExperienceLabel;
    NPS_QualityOfServiceLabel = NPS_QualityOfServiceLabel;
    NPS_SpeedOfServiceLabel = NPS_SpeedOfServiceLabel;

    NPS_Disclaimer = NPS_Disclaimer;

    //boolean
    isLoading = false;
    isStartPage = false;     //SHOW THE OPTION TO SELECT THE LANGUAGE
    isDisclaimerPage = true;
    isShowDriverIcons = false; //show additional feedback driver icons//for testing mobile made as true

    /*after testing remove this block and uncomment above block*/
    //isDisclaimerPage = false;
    //isShowDriverIcons = true;
    /*------------*/

    showDriverOptions = false;   //hide driver option PANEL
    askForditionalFeedback = false; //Question to show additional Question
    showSurveyQuestions = false;

    typeOfDriverSelected;
    driverOptions;

    job_Classification;
    productName;
    customerName;
    productGroupId = '';
    workOrderNo = null;

    additionalFeedbacks = [];
    questionnaireResultId;

    @api workOrderIdFromVF;

    get options() {
        return [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' },
        ];
    }

    get backgroundStyle() {
        return `background-image:url(${BACKGROUND_IMG})`;
    }

    disableSpinner() {
        this.isLoading = false;
    }
    enableSpinner() {
        this.isLoading = true;
    }
    connectedCallback() {
        this.enableSpinner();
        if (this.workOrderIdFromVF != null && this.workOrderIdFromVF != undefined && (this.workOrderIdFromVF == 'Session Expired' || this.workOrderIdFromVF == 'Feedback Submitted')) {
            this.sessionExpiredHelper();
        }
        else if (this.workOrderIdFromVF != null && this.workOrderIdFromVF != undefined) {
            this.getWorkOrderInfoHelper();
        }
        this.getUIThemeDescriptionHelper();
    }

    isMobileDevice = false;
    className = 'bgmobileview';
    getUIThemeDescriptionHelper = async (event) => {
        await getUIThemeDescription().then(result => {
            if (result != null && result != undefined) {
                if (result == 'Theme4t') {
                    this.isMobileDevice = true;
                    this.className = 'bgmobileview';
                    this.driverFontSize = 'driverOptionFontSizeLarge';
                } else {
                    this.className = 'bgDesktopView';
                    this.driverFontSize = 'driverOptionFontSizeSmall';
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }



    disclaimerOnClick() {
        this.isStartPage = true;
        this.isDisclaimerPage = false;
    }

    getWorkOrderInfoHelper = async (event) => {
        await getWorkOrderDetails({ recordID: this.workOrderIdFromVF }).then(result => {
            if (result != null && result != undefined) {
                this.disableSpinner();
                if (result.Customer__c != null && result.Customer__c != undefined) {
                    this.customerName = result.Customer__c;
                } else if (result.ContactId != null && result.ContactId != undefined) {
                    this.customerName = result.Contact.Name;
                } else {
                    if (result.AccountId != null && result.AccountId != undefined) {
                        this.customerName = result.Account.Name;
                    }
                }
                this.workOrderNo = result.WorkOrderNumber;
                this.job_Classification = result.Job_Classification__c;

                this.productGroupId = result.Product_Group__c;
                if (result.Product_Group__c != null && result.Product_Group__c != undefined) {
                    this.productName = result.Product_Group__r.Name;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }

    showSessionExpiredMsg = false;
    sessionExpiredHelper() {
        this.disableSpinner();
        this.isStartPage = false;
        this.showSessionExpiredMsg = true;
        this.isDisclaimerPage = false;
    }

    closeHelper() {
        window.close();
    }

    handleLanguagePicklistChange(event) {
        this.langTypeValue = event.detail.value;
    }

    handleLanguageSubmit = async (event) => {
        var decisionTreeIdFromNPS;
        if (this.langTypeValue == null || this.langTypeValue == undefined || this.langTypeValue == '--Select--') {
            alert('Please select the langugae');
        } else {
            //await getDecisionTreeBasedOnUserInput({ productID: this.productId, typeOfJob: this.job_Classification }).then(result => {
            await getDecisionTreeBasedOnUserInput({ prdtGroupID: this.productGroupId, typeOfJob: this.job_Classification }).then(result => {
                if (result != null && result != undefined) {
                    decisionTreeIdFromNPS = result.Id;
                    this.showSurveyQuestions = true;
                    this.isStartPage = false; //HIDE THE OPTION TO SELECT THE LANGUAGE
                }
            }).catch(error => {
                this.error = error;
            })
        }
        if (decisionTreeIdFromNPS != null) {
            this.isLoading = true;
            this.template.querySelector("c-dt_-questionnaire-component").callFromDigitalNPS(this.workOrderIdFromVF, decisionTreeIdFromNPS, this.langTypeValue);
            setTimeout(() => {
                this.isLoading = false;
            }, 2000);
        }
    }

    //ICON CLICKS
    handleCallCenterClick() {
        this.loadDriverOptionsHelper(this.NPS_CallCenterExperienceLabel);
    }
    handleCostOfServiceClick() {
        this.loadDriverOptionsHelper(this.NPS_CostOfServiceLabel);
    }
    handleProductExpClick() {
        this.loadDriverOptionsHelper(this.NPS_ProductExperienceLabel);
    }
    handleQualityOfServiceClick() {
        this.loadDriverOptionsHelper(this.NPS_QualityOfServiceLabel);
    }
    handleSpeedOfServiceClick() {
        this.loadDriverOptionsHelper(this.NPS_SpeedOfServiceLabel);
    }

    noDriverOptionsBoolean = false;

    translatedDriverOptions;

    loadDriverOptionsHelper = async (typeOfDriver, event) => {
        this.enableSpinner();
        this.updateSurveyStatusHandler('Stage3');//update status with stage3
        await getDriverOptions({ selectedDriver: typeOfDriver, productGroupName: this.productGroupId, typeOfJobClassification: this.job_Classification, selectedLanguage: this.langTypeValue, customerRating: this.customerAnsweredRating }).then(result => {
            if (result != null && result != undefined) {
                this.noDriverOptionsBoolean = false;
                this.disableSpinner();
                this.showDriverOptions = true;   //SHOW driver option PANEL
                this.isStartPage = false;        //HIDE THE OPTION TO SELECT THE LANGUAGE
                //this.typeOfDriverSelected = typeOfDriver; //commented on 12-March to have the language has selected
                this.driverOptions = result.driverOptList;
                this.driverId = result.driverId

                //added on 12-March-2021
                this.translatedDriverOptions = result.langTransList;
                this.typeOfDriverSelected = result.selectedDriverName;

                if (this.translatedDriverOptions != null) {

                    for (let i = 0; i < this.translatedDriverOptions.length; i++) {
                        let notContainsOption = false;
                        if (this.additionalFeedbacks != null && this.additionalFeedbacks.length > 2 && this.additionalFeedbacks != undefined && !this.additionalFeedbacks.includes(this.translatedDriverOptions[i].Driver_Option__r.Name)) {

                            for (let j = 0; j < this.additionalFeedbacks.length; j++) {

                                if (this.additionalFeedbacks[j].driverOptionNo == this.translatedDriverOptions[i].Driver_Option__r.Name) {
                                    notContainsOption = false;
                                    break;
                                } else {
                                    notContainsOption = true;
                                }
                            }
                            if (notContainsOption == true) {
                                this.additionalFeedbacks.push({
                                    driverName: this.typeOfDriverSelected,
                                    driverOptionNo: this.translatedDriverOptions[i].Driver_Option__r.Name,
                                    driverOptionsName: this.translatedDriverOptions[i].Name__c,
                                    driverOptionsChecked: false,
                                });
                            }
                        } else {
                            this.additionalFeedbacks.push({
                                driverName: this.typeOfDriverSelected,
                                driverOptionNo: this.translatedDriverOptions[i].Driver_Option__r.Name,
                                driverOptionsName: this.translatedDriverOptions[i].Name__c,
                                driverOptionsChecked: false,
                            });
                        }
                    }
                }
            } else {
                this.showDriverOptions = false;
                this.disableSpinner();
                this.noDriverOptionsBoolean = true;
            }
        }).catch(error => {
            this.error = error;
        })
    }

    closeDriverOptionPanelOnClick() {
        this.showDriverOptions = false;
        this.typeOfDriverSelected = null;
    }


    onCheckedHandler(event) {
        /*
         console.log('checked value::' + event.currentTarget.value);
         console.log('checked::' + event.currentTarget.checked);*/

        if (this.additionalFeedbacks.length >= 1) {
            for (let i = 0; i < this.additionalFeedbacks.length; i++) {
                if (event.currentTarget.value === this.additionalFeedbacks[i].driverOptionsName) {
                    //this.additionalFeedbacks.splice(i, 1);    //REMOVE THE PREVIOUS ANSWERS
                    this.additionalFeedbacks[i].driverOptionsChecked = event.currentTarget.checked;
                }
            }
        }
    }

    customerAnsweredRating = '';
    customerRefusedFeedback = '';
    customerRatingRemarksAnswer = null;
    //METHOD TO RETURN THE QUESTIONNAIRE RESULT ID FROM DECISION TREE ON SAVE FROM OTHER COMPONENT
    handleOnFinish(event) {
        if (event.detail.queResId != null) {
            this.showSurveyQuestions = false;   //hide survey sections
            this.askForditionalFeedback = true; //ask additional question yes or no

            this.questionnaireResultId = event.detail.queResId;
            if (this.questionnaireResultId != null) {
                this.updateWorkOrderAsFeedSubmittedHelper();
            }
        }
        this.customerAnsweredRating = event.detail.customerAnsweredRating;
        this.customerRefusedFeedback = event.detail.customerRefusedFeedback;
        this.customerRatingRemarksAnswer = event.detail.customerRatingRemarksAnswer;
        //SEND EMAIL TO USERS ON LOW RATING BY CUSTOMER
        if (this.customerAnsweredRating != null && this.customerAnsweredRating <= 6) {
            this.sendSMSToManagementUsers();
        }
        //UPDATE THE WORKORDER SINCE CUSTOMER REFUSED TO PROVIDE FEEDBACK
        if (this.customerRefusedFeedback != null && this.customerRefusedFeedback == true) {
            //customer answered no to question
            this.updateWorkOrderStatusOnRefuseHelper();//Update Wo.Status:Refused to Feedback-Work Still Pending
            this.updateSurveyStatusHandler('Work Still Pending');//Update Survey Status:Incomplete Survey

        }
        //SEND SMS ON PROVIDING FEEDBACK
        this.sendSMSToCustomer();
    }

    updateWorkOrderAsFeedSubmittedHelper() {
        updateWorkOrderAsSubmitted({ workOrderId: this.workOrderIdFromVF }).then(result => {
        }).catch(error => {
            this.error = error;
        })
    }

    //27-April-2021//update survey status: to incomplete
    updateSurveyStatusHandler(surveyStatusValue) {
        //incomplete
        updateSurveyStatusHelper({ workOrderId: this.workOrderIdFromVF, surveyStatus: surveyStatusValue }).then(result => {
        }).catch(error => {
            this.error = error;
        })
    }

    //update the status on refusal//Status:Refused to Feedback-Work Still Pending
    updateWorkOrderStatusOnRefuseHelper() {
        updateWorkOrderStatusOnRefuse({ workOrderId: this.workOrderIdFromVF, feedbackRefused: this.customerRefusedFeedback }).then(result => {
        }).catch(error => {
            this.error = error;
        })
    }

    //SAVE THE ADDITIONAL RESPONSE 
    finishSurveyOnClick = async (event) => {
        this.enableSpinner();
        this.noDriverOptionsBoolean = false;//added on 28-April
        await submitDriverOptions({ questionnaireResId: this.questionnaireResultId, workOrderId: this.workOrderIdFromVF, driverId: this.driverId, feedback: JSON.stringify(this.additionalFeedbacks) }).then(result => {
            if (result != null && result != undefined) {
                this.disableSpinner();
                if (result == true) {
                    this.thankYouResponseHelper();      //thank you swal

                } else {
                    this.errorResponseHelper();
                }
                this.showDriverOptions = false;     //hide driver option panel
                this.isShowDriverIcons = false;     //hide additional feedback driver icons
            }
        }).catch(error => {
            this.error = error;
        })
    }

    //SEND SMS
    sendSMSToCustomer = async (event) => {
        await sendSMSBasedOnRating({ workOrderId: this.workOrderIdFromVF, customerProvidedRating: this.customerAnsweredRating }).then(result => {
            if (result != null && result != undefined) {

            }
        }).catch(error => {
            this.error = error;
        })
    }

    //send sms if user rating is Detractor
    sendSMSToManagementUsers = async (event) => {
        //write logic to initiate sms
        sendEmailOnDetractor({ workOrderId: this.workOrderIdFromVF, customerProvidedRating: this.customerAnsweredRating, customerRatingRemarksAnswer: this.customerRatingRemarksAnswer }).then(result => {
        }).catch(error => {
            this.error = error;
        })
    }


    //RADIO BUTTON FOR DO YOU WANT TO ADD ADDITIONAL QUESTION
    handleRadioChange(event) {
        if (event.detail.value == 'Yes') {
            this.askForditionalFeedback = false; //hide additional question yes or no
            this.isShowDriverIcons = true;   //show additional feedback driver icons
        } else {
            this.thankYouResponseHelper();
            this.askForditionalFeedback = false;
        }
    }

    thankYouResponseHelper() {
        this.swalHelper('Success!!', 'Thanks for your valuable Response!', 'success', null);
    }

    errorResponseHelper() {
        this.swalHelper('Error!!', 'Oops something went wrong!', 'error', null);
    }


    getOtherFeedbackOnChange(event) {
        if (this.additionalFeedbacks.length >= 1) {
            for (let i = 0; i < this.additionalFeedbacks.length; i++) {
                if (event.target.name === this.additionalFeedbacks[i].driverOptionNo) {
                    this.additionalfinishSurveyOnClicks[i].driverOptionsChecked = event.detail.value;
                }
            }
        }
    }

    /*------------SWAL HELPER------------*/
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
    swalHelper(title, text, type, footer) {
        Swal.fire({
            title: title,
            text: text,
            type: type,
            footer: footer
        })
    }
}