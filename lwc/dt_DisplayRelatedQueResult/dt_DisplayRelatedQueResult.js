/*
Desc    : To display the related result based on the page it is loaded.
(Captures the record id on load of the page and fetches for the record)
Author  : Vivek S
Version : 1.0
Company : Marlabs LTD
*/

import { LightningElement, api, wire, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import getRelatedRecords from '@salesforce/apex/DT_DisplayRelatedQueResult.getRelatedRecords';
import { NavigationMixin } from 'lightning/navigation';

export default class Dt_DisplayRelatedQueResult extends NavigationMixin(LightningElement) {
    /*----------GET RECORD ID-------*/
    @api objectApiName;
    @api recordId;
    queResultList;
    noRecordsFound = false; //set to TRUE when has no records to display
    @track columns = [
        {
            label: 'Name',
            fieldName: 'Name',
            type: 'text',
            sortable: true,
            initialWidth: 100,
            wrapText: true,
            hideDefaultActions: "true"
        },
        /* {
             label: 'Created By',
             fieldName: 'CreatedByName',
             sortable: true,
             hideDefaultActions: "true"
         },*/
        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date',
            sortable: true,
            wrapText: true,
            hideDefaultActions: "true"
        },
        {
            label: 'Action',
            type: "button", typeAttributes: {
                label: 'View Record',
                name: 'ViewQueResult',
                title: 'View',
                disabled: false,
                value: 'view',
                iconPosition: 'right'
            }
        },
    ];


    connectedCallback() {
        getRelatedRecords({ recordID: this.recordId }).then(result => {
            if (result != null) {
                if (result.length > 0) {
                    let resultArray = [];
                    result.forEach(record => {
                        let elt = {};
                        elt.Id = record.Id;
                        elt.Name = record.Name;
                        elt.CreatedDate = record.CreatedDate;
                        elt.CreatedByName = record.CreatedBy.Name;
                        resultArray.push(elt);
                    });
                    this.queResultList = resultArray;
                } else {
                    this.noRecordsFound = true;
                }
            } else {
                this.noRecordsFound = true;
            }

        }).catch(error => {
            this.error = error;
        })
    }


    callRowAction(event) {
        const recId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if (actionName != null && actionName === 'ViewQueResult') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recId,
                    objectApiName: 'DT_Questionnaire_Result__c', // objectApiName is optional
                    actionName: 'view'
                }
            });
        }
    }
}