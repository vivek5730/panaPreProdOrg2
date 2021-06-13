/*
Created By      : Vivek S
Purpose         : To update the files by selecting its correspdoing file type
Version         : 1.0
Company         : Marlabs Pvt LTD
*/

import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
// Import custom labels
import WorkOrderFileUploadType from '@salesforce/label/c.WorkOrderFileUploadType';

import loadWorkOrderFiles from '@salesforce/apex/PI_WorkOrder_FileUpload_Handler.loadWorkOrderFiles';
import deleteWorkOrderRelatedFiles from '@salesforce/apex/PI_WorkOrder_FileUpload_Handler.deleteWorkOrderRelatedFiles';

import updateFileType from '@salesforce/apex/PI_WorkOrder_FileUpload_Handler.updateFileType';

import checkIfInvoiceIsPresent from '@salesforce/apex/PI_WorkOrder_FileUpload_Handler.checkIfInvoiceIsPresent';

/*
//view and delete
const viewActions = [
    { label: 'View', name: 'view_File', iconName: 'utility:preview' },
    { label: 'Delete', name: 'delete_File', iconName: 'standard:record_delete' },
];*/

//only view 
const viewActions = [
    { label: 'View', name: 'view_File', iconName: 'utility:preview' }
];
const columns = [
    { label: 'Name', fieldName: 'Title', hideDefaultActions: true },
    { label: 'Type', fieldName: 'PI_Type__c', hideDefaultActions: true },
    {
        label: 'Created Date', fieldName: 'CreatedDate', type: 'date', hideDefaultActions: true, typeAttributes: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    },
    { type: 'action', typeAttributes: { rowActions: viewActions }, },
];

export default class Pi_WorkOrder_FileUpload_LWC extends LightningElement {
    @api recordId;
    @api cardTitle = '';

    //boolean variables
    isLoading = false;   //spinner
    showUploadComp = true;
    hasRelatedFiles = false;

    //NON-BOOLEAN VAR
    fileInputType = '';
    fileType_PicklistValues;

    //regarding files
    @track showLoadingSpinner = false;
    @track data;
    file;

    @track columns = columns;

    connectedCallback() {
        this.recordId = this.cardTitle;
        this.setFileUploadTypeOptionsHelper();
        this.loadExistingWorkOrderRelatedFilesHelper();
    }

    loadExistingWorkOrderRelatedFilesHelper = async (event) => {
        await loadWorkOrderFiles({ parentId: this.recordId })
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

            }).catch(error => {
                this.showToastEventHelper('Error', error.body.message, 'error');
            });
    }

    setFileUploadTypeOptionsHelper() {
        var res = WorkOrderFileUploadType.split(", ");
        let optionsValues = [];
        if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
                optionsValues.push({
                    label: res[i],
                    value: res[i]
                })
            }
            this.fileType_PicklistValues = optionsValues;
        }
    }


    handlePicklistChange(event) {
        if (event.detail.value != 'Invoice' && event.detail.value != 'FG Model & Sr. No' && event.detail.value != 'Part Sr. No') {
            this.fileInputType = event.detail.value;
        } else {
            this.fileInputType = '';
            this.checkForExistingInvoiceHelper(event.detail.value);
        }
    }

    checkForExistingInvoiceHelper = async (fileType, event) => {
        await checkIfInvoiceIsPresent({ workOrderId: this.recordId, fileType: fileType }).then(result => {
            if (result != undefined && result != null) {
                if (result == 'true') {
                    this.showFileUpload = true;
                    this.showToastEventHelper('Warning', fileType + ' already exist for this workorder!!', 'warning');
                } else if (result == 'noAsset') {
                    this.showFileUpload = true;
                    this.showToastEventHelper('Warning', 'Asset is required to upload the file.', 'warning');
                } else if (result == 'false') {
                    this.fileInputType = fileType;
                }
            }
        }).catch(error => {
            this.showToastEventHelper('Error', error.body.message, 'error');
        });
    }

    onRowSelectHandler(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        var fileLink = '';
        switch (actionName) {
            case 'edit_File':
                //console.log('edit_File');
                break;
            case 'delete_File':
                var contentDocId;
                for (let i = 0; i < this.data.length; i++) {
                    if (this.data[i].Id === row.Id) {
                        contentDocId = this.data[i].ContentDocumentId;
                        break;
                    }
                }
                if (contentDocId != null && contentDocId != undefined) {
                    this.deleteWorkOrderFileHelper(contentDocId);
                }
                break;
            case 'view_File':
                for (let i = 0; i < this.data.length; i++) {
                    if (this.data[i].Id === row.Id) {
                        fileLink = this.data[i].ContentDocumentId;
                        break;
                    }
                }
                var recId = fileLink;
                this.dispatchEvent(new CustomEvent('myevent', {
                    detail: {
                        data: recId
                    }
                }));
                break;
        }
    }

    deleteWorkOrderFileHelper = async (rowId, event) => {
        await deleteWorkOrderRelatedFiles({ contDocId: rowId }).then(result => {
            if (result != undefined && result != null) {
                this.loadExistingWorkOrderRelatedFilesHelper();
                if (result == true) {
                    this.showToastEventHelper('Success!!', 'Deleted Successfully.', 'success');
                }

            }
        }).catch(error => {
            this.showToastEventHelper('Error', error.body.message, 'error');
        });
    }

    showToastEventHelper(inputTitle, toastMsg, variantType) {
        // Showing Success message after file insert
        this.dispatchEvent(new ShowToastEvent({ title: inputTitle, message: toastMsg, variant: variantType, }));
    }

    get acceptedFormats() {
        return ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.csv'];
    }
    handleUploadFinished = async (event) => {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        //console.log(JSON.stringify(uploadedFiles));
        let uploadedFileNames = ''; let uploadedContentFileIds = '';
        for (let i = 0; i < uploadedFiles.length; i++) {
            // uploadedFileNames += uploadedFiles[i].name + ', ';
            if (i < uploadedFiles.length - 1) {
                uploadedContentFileIds += uploadedFiles[i].contentVersionId + ',';
            } else {
                uploadedContentFileIds += uploadedFiles[i].contentVersionId;
            }
        }

        this.showToastEventHelper('Success', uploadedFiles.length + ' Files uploaded Successfully: ' + uploadedFileNames, 'success');

        await updateFileType({ fileType: this.fileInputType, contentVersionIds: uploadedContentFileIds, workOrderId: this.recordId })
            .then(result => {
                var res = result;
                this.fileInputType = '';
                if (res != undefined && res != null) {
                    if (res.length > 0) {
                        this.hasRelatedFiles = true;
                    }
                    this.data = result;
                } else {
                    this.hasRelatedFiles = false;
                }

            }).catch(error => {
                this.showToastEventHelper('Error', error.body.message, 'error');
            });

        this.showFileUpload = true;
        // this.fileInputType = null;
        this.loadExistingWorkOrderRelatedFilesHelper();
        //this.fileType_PicklistValues = null;
        this.setFileUploadTypeOptionsHelper();
    }
    showFileUpload = true;

    proceedFileUploadOnClick() {
        if (this.fileInputType == null || this.fileInputType == undefined || this.fileInputType == '' || this.fileInputType == '-Select-') {
            this.showToastEventHelper('Warning', 'Select the Type or another type to Proceed.', 'warning');
        } else {
            this.showFileUpload = false;
        }
    }
}