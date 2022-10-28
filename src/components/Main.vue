<template>
  <div>
    <div>
      <div class="row mt-1 ml-2">
        <v-btn
          class="ma-2 ml-1 col-4"
          color="normal"
          @click="changeStatus()"
          v-if="this.manual_review.status == 1 && !this.reopened"
        >
          <v-icon dark left> mdi-arrow-right-drop-circle-outline </v-icon>

          Iniciar Revisão
        </v-btn>
        <v-btn
          class="ma-2 ml-1 col-4"
          color="normal"
          @click="changeStatus()"
          v-if="this.manual_review.status == 1 && this.reopened"
        >
          <v-icon dark left> mdi-arrow-right-drop-circle-outline </v-icon>

          Reabrir Revisão
        </v-btn>
        <v-btn
          class="ma-2 ml-1 col-4"
          color="secondary"
          @click="changeStatus()"
          v-if="this.manual_review.status == 2"
        >
          <v-icon dark left> mdi-pause-octagon-outline </v-icon>
          Finalizar Revisão
        </v-btn>
        <v-autocomplete
          class="col-7"
          v-model="analyst_name"
          :items="analysts"
          label="Analista Principal"
          :disabled="this.manual_review.status == 1"
        ></v-autocomplete>

        <v-btn
          class="ma-2 ml-1 col-5"
          color="normal"
          :disabled="this.manual_review.status == 1"
          @click="onCommentClick()"
        >
          <v-icon dark left> mdi-file-plus </v-icon>
          Adicionar Comentario
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import bus from "../utils/bus";
import config from "../utils/config";

export default {
  data() {
    return {
      title: "Manual review",
      manual_review: {
        sise_key: null,
        user_name: null,
        status: 1,
        created_at: null,
      },
      analysts: [],
      analyst_name: null,
      reopened: false,
    };
  },
  methods: {
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
    async configure() {
      const popupUrl = `${window.location.origin}/#/configure`;
      await tableau.extensions.ui
        .displayDialogAsync(popupUrl, "JSON.stringify(dataTable)", {
          height: 750,
          width: 500,
        })
        .then((closePayload) => {
          console.log(closePayload);
        })
        .catch((error) => {
          switch (error.errorCode) {
            case tableau.ErrorCodes.DialogClosedByUser:
              console.log("Dialog was closed by user");
              break;
            default:
              console.error(error.message);
          }
        });
    },
    async onCommentClick() {
      let ref = this;
      const popupUrl = `${window.location.origin}/#/comment`;
      const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === "DETALHE1" //tableau.extensions.settings.get("MANUAL_REVIEW_WORKSHEET")
      );
      worksheet.getSummaryDataAsync().then(function (dataTable) {
        dataTable["analystName"] = ref.analyst_name;

        tableau.extensions.ui
          .displayDialogAsync(popupUrl, JSON.stringify(dataTable), {
            height: 350,
            width: 500,
          })
          .then((closePayload) => {
            console.log(closePayload);
          })
          .catch((error) => {
            switch (error.errorCode) {
              case tableau.ErrorCodes.DialogClosedByUser:
                console.log("Dialog was closed by user");
                break;
              default:
                console.error(error.message);
            }
          });
      });
    },
    addValidationEventHandler() {
      //adiciona escuta o evento de clique na planilha de detalhes
      const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === tableau.extensions.settings.get("VALIDATION_WORKSHEET")
      );

      const worksheet_manualReview = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === tableau.extensions.settings.get("MANUAL_REVIEW_WORKSHEET")
      );

      worksheet.addEventListener(
        tableau.TableauEventType.MarkSelectionChanged,
        (markSelectionEvent) => {
          markSelectionEvent.getMarksAsync().then((marks) => {
            const dataTable = marks.data[0];
            if (dataTable.totalRowCount == 1) {
              const popupUrl = `${window.location.origin}/#/review_validation`;
              tableau.extensions.ui
                .displayDialogAsync(popupUrl, JSON.stringify(dataTable), {
                  height: 450,
                  width: 500,
                })
                .then((closePayload) => {
                  // console.log(closePayload)
                })
                .catch((error) => {
                  switch (error.errorCode) {
                    case tableau.ErrorCodes.DialogClosedByUser:
                      console.log("Dialog was closed by user");
                      break;
                    default:
                      console.error(error.message);
                  }
                });
            }
          });
        }
      );

      worksheet_manualReview.addEventListener(
        tableau.TableauEventType.MarkSelectionChanged,
        (markSelectionEvent) => {
          markSelectionEvent.getMarksAsync().then((marks) => {
            const dataTable = marks.data[0];
            dataTable["analystName"] = this.analyst_name;
            console.log(dataTable);
            if (dataTable.totalRowCount == 1) {
              const popupUrl = `${window.location.origin}/#/manual_review`;
              tableau.extensions.ui
                .displayDialogAsync(popupUrl, JSON.stringify(dataTable), {
                  height: 490,
                  width: 500,
                })
                .then((closePayload) => {
                  // console.log(closePayload)
                })
                .catch((error) => {
                  switch (error.errorCode) {
                    case tableau.ErrorCodes.DialogClosedByUser:
                      console.log("Dialog was closed by user");
                      break;
                    default:
                      console.error(error.message);
                  }
                });
            }
          });
        }
      );
    },
    changeStatus() {
      this.manual_review.created_at = new Date(Date.now()).toISOString();
      axios
        .get(
          `${config.HEROKU_URL}/get_status_motor?sise_key=${this.manual_review.sise_key}`
        )
        .then((res) => {
          if (res.data == "nothing") {
            axios.post(`${config.HEROKU_URL}/create_status_motor`, this.manual_review);
          } else {
            axios.post(`${config.HEROKU_URL}/update_status_motor`, this.manual_review);
          }
        });
      if (this.manual_review.status == 1) {
        this.manual_review.status = 2;
        this.addValidationEventHandler();
      } else {
        this.reopened = true;
        this.manual_review.status = 1;
      }
    },
  },
  mounted: function () {
    let ref = this;

    tableau.extensions
      .initializeAsync({ configure: this.configure })
      .then(async function () {
        /*         await tableau.extensions.settings.set("last_analyst_name", "nothing");
        await tableau.extensions.settings.saveAsync();
        tableau.extensions.settings.saveAsync(); */

        const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
          (w) => w.name === tableau.extensions.settings.get("MANUAL_REVIEW_WORKSHEET")
        );
        worksheet.getSummaryDataAsync().then(function (dataTable) {
          ref.manual_review.sise_key = ref.getValueFromDataTable(
            dataTable,
            tableau.extensions.settings.get("MANUAL_REVIEW_SISE_KEY")
          );
          ref.manual_review.user_name = ref.getValueFromDataTable(
            dataTable,
            tableau.extensions.settings.get("MANUAL_REVIEW_USER")
          );
          axios
            .get(
              `${config.HEROKU_URL}/get_status_motor?sise_key=${ref.manual_review.sise_key}`
            )
            .then((res) => {
              console.log(res);
              if (res.data == "nothing") {
                ref.manual_review.status = 1;
              } else if (res.data[0].status == 1) {
                ref.reopened = true;
              } else {
                ref.manual_review.status = 2;
                ref.addValidationEventHandler();
              }
            });
        });

        //TODO: só executar o restante do código quando clicar no botão "iniciar revisão"
        // Encapsular o código abaixo em um metodo e chamar ele por meio da função watch que válida se o manual_revuew.status == 2

        //inicializa variáveis de configuração
        //let first_setup = tableau.extensions.settings.get("first_setup");
        /*     if (typeof first_setup == "undefined") {
      ref.configure().then((t) => {
        ref.addValidationEventHandler();
      });
    } else { */
        //ref.addValidationEventHandler();
        //}

        let worksheet_analysts = tableau.extensions.dashboardContent.dashboard.worksheets.find(
          (w) => w.name === "Supp_analista" // TODO (selecionar ela nas configs configs) ->  settings.worksheet
        );
        worksheet_analysts.getSummaryDataAsync().then(function (sumdata) {
          sumdata.data.forEach((element) => {
            ref.analysts.push(element[0]._value);
          });
          ref.analysts = ref.analysts
            .filter((i) => {
              return i;
            })
            .sort();
        });
        let worksheet2 = tableau.extensions.dashboardContent.dashboard.worksheets.find(
          (w) => w.name === "DETALHE1"
        );
        worksheet2.getSummaryDataAsync().then(function (sumdata) {
          ref.analyst_name = sumdata.data[0][2]._value;
        });
      });
  },
};
</script>
