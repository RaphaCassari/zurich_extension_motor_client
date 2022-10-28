<template>
  <v-container>
    <template>
      <v-container fluid class="text-right">
        <v-row>
          <v-col cols="12" md="6">
            <v-textarea
              filled
              name="input-7-4"
              label="Comentário Geral"
              v-model="manual_review.comment"
            ></v-textarea>
          </v-col>
        </v-row>
        <v-btn
          class="ma-2 ml-1"
          color="primary"
          @click="send()"
          :disabled="manual_review.comment == ''"
        >
          Adicionar Comentario
        </v-btn>
      </v-container>
    </template>
  </v-container>
</template>
<script>
import axios from "axios";
import bus from "../utils/bus";
import config from "../utils/config";
import Swal from "sweetalert2";

export default {
  data() {
    return {
      firstComment: true,
      manual_review: {
        comment: "",
        created_at: null,
        sise_key: null,
        user_name: null,
        analystName: null,
        coverage_id: null,
        type_loss: null,
        number_warning: null,
      },
    };
  },
  methods: {
    send() {
      if (this.firstComment) {
        axios
          .post(`${config.URL_DEV}/create_comment_motor`, this.manual_review)
          .then((res) => {
            const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
              (w) => w.name === "DETALHE2"
            );
            worksheet.getDataSourcesAsync().then((datasources) => {
              const datasource = datasources.find(
                (d) =>
                  d.name === tableau.extensions.settings.get("MANUAL_REVIEW_DATASOURCE")
              );
              datasource.refreshAsync().then(() => {
                Swal.fire(
                  "Comentario Enviado!",
                  "Feedback enviado por E-mail",
                  "success"
                ).then(() => {
                  tableau.extensions.ui.closeDialog();
                });
              });
            });
          });
      } else {
        axios
          .post(`${config.URL_DEV}/update_comment_motor`, this.manual_review)
          .then((res) => {
            /*             const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
              (w) => w.name === "DETALHE2"
            );
            worksheet.getDataSourcesAsync().then((datasources) => {
              const datasource = datasources.find(
                (d) =>
                  d.name === tableau.extensions.settings.get("MANUAL_REVIEW_DATASOURCE")
              );
              datasource.refreshAsync().then(() => {
                Swal.fire(
                  "Comentario Enviado!",
                  "Feedback enviado por E-mail",
                  "success"
                ).then(() => {
                  tableau.extensions.ui.closeDialog();
                });
              });
            }); */
          })
          .catch((err) => console.log(err));
      }
      axios.post(`${config.URL_DEV}/send_email_motor`, this.manual_review);
    },
    getValueFromDataTable(dataTable, fieldName) {
      let col = dataTable._columns.find((col) => {
        if (col._fieldName.includes("(")) {
          let _fieldName = col._fieldName.substring(
            col._fieldName.indexOf("(") + 1,
            col._fieldName.length - 1
          );
          return _fieldName == fieldName;
        }
        return col._fieldName == fieldName;
      });
      if (typeof col != "undefined") {
        return dataTable._data[0][col._index]._value;
      } else {
        return null;
      }
    },
  },
  async mounted() {
    let ref = this;

    tableau.extensions.initializeDialogAsync().then(function (openPayload) {
      let dataTable = JSON.parse(openPayload);

      let worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === "DETALHE2"
      );
      worksheet.getSummaryDataAsync().then(function (sumdata) {
        ref.manual_review.type_loss = sumdata.data[0][1]._value;
      });

      worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === "DETALHE2"
      );
      worksheet.getSummaryDataAsync().then(function (sumdata) {
        ref.manual_review.number_warning = sumdata.data[0][1]._value;
      });

      ref.manual_review.analystName = dataTable.analystName;
      ref.manual_review.sise_key = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_SISE_KEY")
      );

      ref.manual_review.user_name = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_USER_FIELD")
      );

      ref.manual_review.coverage_id = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_COVERAGE_ID_FIELD")
      );
      ref.manual_review.created_at = new Date(Date.now()).toISOString();
      console.log(ref.manual_review);

      let url = `${config.URL_DEV}/get_comment_motor?sise_key=${ref.manual_review.sise_key}`;
      axios.get(url, ref.manual_review).then((res) => {
        ref.manual_review.comment = res.data;
        if (res.data != "") {
          ref.firstComment = false;
        }
      });
    });
  },
};
</script>

<style scoped></style>
