import { LightningElement, api, track } from 'lwc';
import getMRQHVFiles from '@salesforce/apex/PI_CreateMQRHandler.getMRQHVFiles';

const viewActions = [
    { label: 'View', name: 'view_File', iconName: 'utility:preview' },

];
const columns = [
    { label: 'Name', fieldName: 'Name', hideDefaultActions: true },
    { label: 'Type', fieldName: 'PI_Type__c', hideDefaultActions: true },
    //{ label: 'Form', fieldName: 'PI_MQR_Form__c', hideDefaultActions: true },
    { type: 'action', typeAttributes: { rowActions: viewActions }, },
];
export default class DdmMQRFileView extends LightningElement {
    @api mqrId;
    showMQRHVTable = false;
    @track columns = columns;
    @track data;
    mapOfMQRHVFiles = '';

    connectedCallback() {
        this.loadFilesMQRHV(this.mqrId);
    }

    loadFilesMQRHV = async (rowId, event) => {
        await getMRQHVFiles({ mqrFormId: rowId }).then(result => {
            if (result != null) {
                this.mapOfMQRHVFiles = result.filesMQRHVMap;
                this.data = result.filesMQRHVList;
                this.showMQRHVTable = true;
            }
            console.log('leng::' + result.filesMQRHVList.length);
        }).catch(error => {
            this.error = error;
        })
    }

    onRowSelectHandler(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        var fileLink = '';
        console.log('view file');
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
        window.open('/' + recId,'_blank')
        /*this.dispatchEvent(new CustomEvent('myevent', {
            detail: {
                data: recId
            }
        }));*/
    }
}