import { LightningElement,api} from 'lwc';

export default class RecordEditFormCreateExampleLWC extends LightningElement {

    @api recordId;

    handleSuccess(event) {
        console.log('onsuccess event recordEditForm',event.detail.id)
    }
    handleSubmit(event) {
        
            event.preventDefault();       // stop the form from submitting
            const fields = event.detail.fields;
            fields.VOC_Escalation__c = true;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    activeSections = ['A', 'B' ,'C', 'D','E','F','G'];
    activeSectionsMessage = '';

    handleSectionToggle(event) {
        const openSections = event.detail.openSections;

        if (openSections.length === 0) {
            this.activeSectionsMessage = 'All sections are closed';
        } else {
            this.activeSectionsMessage =
                'Open sections: ' + openSections.join(', ');
        }
    }

}