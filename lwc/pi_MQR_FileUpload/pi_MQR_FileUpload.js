/*
Created By      : Vivek S
CreatedDate		: 25-Jan-2021
Purpose         : To be used in MQR Form object to upload files 
LastModified On : 12-May-2021
*/

import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';   //update record
/*--------BELOW IS FOR PICKLIST--------*/
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import File_MQRHV_OBJECT from '@salesforce/schema/PI_File_MQR_HV__c';   //GET OBJECT DESCRIPTION/SCHEMA
import File_MQRHV_Type_FIELD from '@salesforce/schema/PI_File_MQR_HV__c.PI_Type__c';  //GET PICKLIST VALUE

import getMRQHVFiles from '@salesforce/apex/PI_CreateMQRHandler.getMRQHVFiles';
import deleteMQRandFile from '@salesforce/apex/PI_CreateMQRHandler.deleteMQRandFile';

//added on 12-April
import updateFileType from '@salesforce/apex/PI_CreateMQRHandler.updateFileType';
import getUIThemeDescription from '@salesforce/apex/PI_CreateMQRHandler.getUIThemeDescription';
const viewActions = [
    { label: 'View', name: 'view_File', iconName: 'utility:preview' },
    { label: 'Delete', name: 'delete_File', iconName: 'standard:record_delete' },
];
const columns = [
    { label: 'Name', fieldName: 'Name', hideDefaultActions: true },
    { label: 'Type', fieldName: 'PI_Type__c', hideDefaultActions: true },
    //{ label: 'Form', fieldName: 'PI_MQR_Form__c', hideDefaultActions: true },
    {
        label: 'Created Date', fieldName: 'CreatedDate', type: 'date', hideDefaultActions: true, typeAttributes: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    },
    { type: 'action', typeAttributes: { rowActions: viewActions }, },
];

export default class Pi_MQR_FileUpload extends NavigationMixin(LightningElement) {
    @api recordId;
    @api recId = '';
    @api mqrRecordId = '';
    @api requestFromDDM = false;

    //REGARDING THE PICKLIST
    @wire(getObjectInfo, { objectApiName: File_MQRHV_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: File_MQRHV_Type_FIELD })
    file_MQRHV_TypeValues;


    //------custom variables----------
    //boolean variables
    showCreateBtn = false;
    isLoading = false;   //spinner
    showUploadComp = true;
    showMQRHVTable = false;
    showFSLButton = true;

    //NON-BOOLEAN VAR
    fileInputType = null;
    contentVersionId = '';
    mqrFormName = '';

    //regarding files
    @track data;
    file;
    content;

    @track columns = columns;
    mapOfMQRHVFiles = '';

    connectedCallback() {
        //console.log('recId from aura' + this.recId);
        //console.log('requestFromDDM---'+this.requestFromDDM);
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);
        if (this.requestFromDDM == true) {
            this.recordId = this.mqrRecordId;
            //this.showFSLButton = false;
        }
        else {
            this.recordId = this.recId;
        }
        this.loadFilesMQRHV(this.recordId);
        this.getUIThemeDescriptionHelper();
    }

    getUIThemeDescriptionHelper = async (event) => {
        await getUIThemeDescription().then(result => {
            if (result != null && result != undefined) {
                if (result == 'Theme4t') {
                    this.showFSLButton = true;
                } else {
                    this.showFSLButton = false;;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }


    handlePicklistChange(event) {
        this.fileInputType = event.detail.value;
    }

    showToastEventHelper(inputTitle, toastMsg, variantType) {
        // Showing Success message after file insert
        this.dispatchEvent(
            new ShowToastEvent({
                title: inputTitle,
                message: toastMsg,
                variant: variantType,
            }),
        );
    }

    loadFilesMQRHV = async (rowId, event) => {
        await getMRQHVFiles({ mqrFormId: rowId }).then(result => {
            if (result != null) {
                this.mqrFormName = result.mqrName;
                this.mapOfMQRHVFiles = result.filesMQRHVMap;
                this.data = result.filesMQRHVList;
                if (result.filesMQRHVList.length > 0) {
                    this.showMQRHVTable = true;
                }

            }
        }).catch(error => {
            this.error = error;
        })
    }
    openFileRecordOnClick(event) {
        var fields = event.currentTarget.dataset.id.split('.com/');
        var recId = fields[1];
        this.openRecordInNewTabHandler(recId);
    }
    openRecordInNewTabHandler(recId) {
        window.open('/' + recId, '_blank');
    }

    //delete only the file of mqr form
    deleteMQRHVRecordOnClick = async (event) => {
        var varMQRHVRecId = event.target.dataset.id;
        this.deleteMQRFileHelper(varMQRHVRecId);
    }

    deleteMQRFileHelper = async (varMQRHVRecId, event) => {
        await deleteMQRandFile({ mqrFormId: null, mrqHVRecId: varMQRHVRecId }).then(result => {
            if (result != null && result != undefined) {
                this.showToastEventHelper('Success!!', 'Deleted Successfully!!!', 'success');
                this.loadFilesMQRHV(this.recordId, event);
            }
        }).catch(error => {
            this.error = error;
        })
    }



    onRowSelectHandler(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        var fileLink = '';
        switch (actionName) {
            case 'edit_File':
                console.log('edit_File');
                break;
            case 'delete_File':
                this.deleteMQRFileHelper(row.Id);
                break;
            case 'view_File':
                for (let key in this.mapOfMQRHVFiles) {
                    if (key == row.Id) {
                        fileLink = this.mapOfMQRHVFiles[key].PI_File_Link__c;
                        break;
                    }
                }
                var fields = fileLink.split('.com/');

                var recId = fields[1];
                //     this.filePreview(recId);
                //   this.filePreview(fileLink);
                this.fileToPreviewId = fields[1];
                this.dispatchEvent(new CustomEvent('myevent', {
                    detail: {
                        data: recId
                    }
                }));
                break;
        }
    }

    filePreview(contentDocId, event) {
        // Naviagation Service to the show preview
        /* this[NavigationMixin.Navigate]({
             type: 'standard__namedPage',
             attributes: {
                 pageName: 'filePreview'
             },
             state: {
                 // assigning ContentDocumentId to show the preview of file
                 selectedRecordId: contentDocId
             }
         })
         
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: '0696D000000ZyBsQAK',
                objectApiName: 'File',
                actionName: 'view'
            }
        })
*/
        /*       
        this[NavigationMixin.Navigate]({
                    // "type": "standard__webPage",
                    "attributes": {
                         "url": "com.salesforce.fieldservice://v1/sObject/0696D000000ZyBsQAK/Files" 
                    }
                });*/
        sforce.one.navigateToSObject('0696D000000ZyBsQAK', view);
    }
    // Navigation to web page 
    navigateToWebPage() {
        alert('navigate to ' + this.recordId);
        this[NavigationMixin.Navigate]({
            // "type": "standard__webPage",
            "attributes": {
                "url": "com.salesforce.fieldservice://v1/sObject/" + this.recordId + "/details"
            }
        });
    }

    //added on 12-April
    get acceptedFormats() {
        return ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.csv','.msg','.html'];
    }
    showFileUploadBtn = true;
    proceedFileUploadOnClick() {
        if (this.fileInputType == null || this.fileInputType == undefined) {
            alert('Select the file Type to Proceed!!');
        } else {
            this.showFileUploadBtn = false;
        }
    }


    fileUploadedDataArr = [];
    handleUploadFinished = async (event) => {
        this.fileUploadedDataArr = [];
        const uploadedFiles = event.detail.files;
        let uploadedFileNames = ''; let uploadedContentFileIds = '';
        for (let i = 0; i < uploadedFiles.length; i++) {
            this.fileUploadedDataArr.push({
                contentFileName: uploadedFiles[i].name,
                contentFileId: uploadedFiles[i].contentVersionId,
                contentDocumentId: uploadedFiles[i].documentId,
            });
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: uploadedFiles.length + ' Files uploaded Successfully: ' + uploadedFileNames,
                variant: 'success',
            }),
        )
        await updateFileType({ fileType: this.fileInputType, contentVersionIds: uploadedContentFileIds, recId: this.recordId, fileData: JSON.stringify(this.fileUploadedDataArr) })
            .then(result => {
                var res = result;
                if (res != undefined && res != null) {
                    if (res.length > 0) {
                        this.hasRelatedFiles = true;
                    }
                    this.data = result;
                } else {
                    this.hasRelatedFiles = false;
                }
            })
            .catch(error => {
                console.log(error);
            });

        this.showFileUploadBtn = true;
        this.loadFilesMQRHV(this.recordId);
    }
}