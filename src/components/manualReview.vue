<template>
  <v-container>
    <v-toolbar color="primary" cards dark flat>
      <v-card-title class="col-8 title font-weight-regular">
        Revisão Manual
      </v-card-title>
      <v-select
        class="pt-5"
        v-model="manual_review.period"
        :items="periodos"
        label="Periodo"
        :rules="notEmptyRule"
      ></v-select>
    </v-toolbar>

    <v-form ref="form" class="pa-4">
      <!-- <h4>Verificação em Análise:</h4> -->
      <h5 style="margin-bottom: 30px">
        {{ manual_review.verification }}
      </h5>
      <v-radio-group
        v-model="manual_review.result"
        row
        :rules="[(v) => !!v || 'Selecione uma opção.']"
      >
        <div class="row" style="justify-content: space-between">
          <v-radio label="Compliance" value="1"></v-radio>
          <v-radio label="Não Compliance" value="2"></v-radio>
          <v-radio label="N/A" value="3"></v-radio>
        </div>
      </v-radio-group>

      <div class="row" v-if="manual_review.result != 0">
        <div class="col-6">
          <!--         <v-select
            v-if="manual_review.result == 2"
            v-model="manual_review.root_cause_id"
            :items="causes"
            label="Causa"
            :rules="notEmptyRule"
          ></v-select> -->
          <v-select
            v-model="manual_review.analyst_name"
            :items="analysts"
            label="Analista"
            :disabled="haveAnalyst"
          ></v-select>
          <v-select
            v-if="manual_review.result == 2"
            v-model="manual_review.impact"
            :items="impactos"
            label="Impacto"
          ></v-select>
        </div>
        <div class="col-6">
          <v-textarea
            filled
            name="input-7-4"
            label="Comentario"
            v-model="manual_review.comment"
          ></v-textarea>
        </div>
        <v-row v-if="manual_review.result == 2">
          <!-- <v-col md="2">
            <v-checkbox
              v-model="manual_review.feedback_positive"
              :label="'Feedback Positivo'"
            ></v-checkbox>
          </v-col> -->
          <v-col md="2">
            <v-checkbox
              v-model="manual_review.training_opportunity"
              :label="'Oportunidade Treinamento'"
            ></v-checkbox>
          </v-col>
          <v-col md="2"></v-col>
          <v-col md="2"></v-col>
          <v-col md="2" class="pt-8">
            <v-btn
              class="white--text"
              color="primary"
              @click="saveDialog()"
              :disabled="manual_review.impact == null || manual_review.comment == ''"
            >
              Salvar
            </v-btn>
          </v-col>
        </v-row>
        <div class="col-9">
          <v-checkbox
            v-if="manual_review.result == 1"
            v-model="manual_review.feedback_positive"
            :label="'Feedback Positivo'"
          ></v-checkbox>
        </div>
        <div class="col-3 pt-8">
          <v-btn
            class="white--text"
            color="primary"
            @click="saveDialog()"
            v-if="manual_review.result != 2"
          >
            Salvar
          </v-btn>
        </div>
      </div>
    </v-form>

    <v-dialog v-model="dialog" hide-overlay persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          Processando...
          <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="error_dialog">
      {{ error_text }}

      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="error_dialog = false">
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>
<script>
import axios from "axios";
import bus from "../utils/bus";
import config from "../utils/config";
import rootCause_API from "../services/axios";

export default {
  data() {
    return {
      isAnalyst_OfDatabase: false,
      haveAnalyst: false,
      analysts: [],
      causes: [],
      periodos: [],
      checkbox1: false,
      impactos: ["Baixo", "Médio", "Alto"],
      manual_review: {
        id: "",
        root_cause_id: null,
        analyst_name: null,
        impact: null,
        comment: "",
        feedback_positive: null,
        training_opportunity: null,
        result: 0,
        sise_key: "",
        validation_id: "",
        verification: "",
        user_name: "",
        created_at: "",
        period: "",
      },
      root_causes: [],
      dialog: false,
      error_dialog: false,
      error_text: "",
      notEmptyRule: [
        (v) => {
          if (v == "") {
            return !!v || "Selecione uma opção.";
          } else {
            return true;
          }
        },
      ],
    };
  },
  methods: {
    getValueFromDataTable(dataTable, fieldName) {
      let col = dataTable._columns.find((col) => col._fieldName == fieldName);
      if (typeof col != "undefined") {
        return dataTable._data[0][col._index]._value;
      } else {
        return null;
      }
    },

    closeDialog() {
      tableau.extensions.ui.closeDialog();
    },
    saveDialog() {
      if (this.$refs.form.validate()) {
        this.manual_review.created_at = new Date(Date.now()).toISOString().split(".")[0];

        this.dialog = true;
        let url = `${config.HEROKU_URL}/manual_check_motor`;
        axios
          .post(url, this.manual_review)
          .then(() => {
            //atualiza os datasources que são live
            const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
              (w) => w.name === tableau.extensions.settings.get("MANUAL_REVIEW_WORKSHEET")
            );
            worksheet
              .getDataSourcesAsync()
              .then((datasources) => {
                const datasource = datasources.find(
                  (d) =>
                    d.name === tableau.extensions.settings.get("MANUAL_REVIEW_DATASOURCE")
                );
                datasource
                  .refreshAsync()
                  .then(() => {
                    this.dialog = false;
                    tableau.extensions.ui.closeDialog(JSON.stringify(this.manual_review));
                  })
                  .catch((error) => {
                    this.dialog = false;
                    this.error_text = `Erro ao atualizar dados no painel. Entretanto os dados foram salvos. ${error.message}`;
                    this.error_dialog = true;
                    throw error;
                  });
              })
              .catch((error) => {
                this.dialog = false;
                this.error_text = `Erro ao atualizar dados no painel. Entretanto os dados foram salvos. ${error.message}`;
                this.error_dialog = true;
                throw error;
              });
          })
          .catch((error) => {
            this.dialog = false;
            this.error_text = `Erro ao salvar dados no servidor. ${error.message}`;
            this.error_dialog = true;
            throw error;
          });
      }
    },
  },
  async mounted() {
    let today = new Date();
    let quarter = Math.floor((today.getMonth() + 3) / 3);
    for (let i = 0; i < quarter; i++) {
      this.periodos.push(today.getFullYear() + " - Q" + (i + 1));
    }
    for (let i = 0; i < 4; i++) {
      this.periodos.push(today.getFullYear() - 1 + " - Q" + (i + 1));
    }
    this.manual_review.period = today.getFullYear() + " - Q" + quarter;

    let ref = this;
    tableau.extensions.initializeDialogAsync().then(function (openPayload) {
      let dataTable = JSON.parse(openPayload);

      let worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        (w) => w.name === "Supp_analista" // TODO (selecionar ela nas configs configs) ->  settings.worksheet
      );
      worksheet.getSummaryDataAsync().then(function (sumdata) {
        sumdata.data.forEach((element) => {
          ref.analysts.push(element[0]._value);
        });
        ref.analysts = ref.analysts
          .filter((i) => {
            return i;
          })
          .sort();
      });

      ref.manual_review.user_name = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_USER")
      );
      ref.manual_review.sise_key = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_SISE_KEY")
      );
      ref.manual_review.verification = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_VERIFICATION")
      );
      ref.manual_review.validation_id = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_VALIDATION_ID")
      );
      ref.manual_review.created_at = new Date(Date.now()).toISOString();

      console.log('manueal review', ref.manual_review)

      axios
        .get(
          `${config.HEROKU_URL}/getAnalystById_motor?validation_id=${ref.manual_review.validation_id}&sise_key=${ref.manual_review.sise_key}`
        )
        .then((res) => {
          if (res.data != "nothing") {
            ref.isAnalyst_OfDatabase = true;
            ref.manual_review.analyst_name = res.data;
          } else {
            console.log(dataTable.analystName);
            ref.manual_review.analyst_name = dataTable.analystName;
          }
          this.haveAnalyst = true;
        });
        console.log('manueal review', ref.manual_review)
    });
  },
  watch: {
    "manual_review.result"(val) {
      if (val == "1") this.manual_review.feedback_positive = false;
      else {
        this.manual_review.feedback_positive = null;
      }
      if (val == "2") this.manual_review.training_opportunity = false;
      else {
        this.manual_review.training_opportunity = null;
      }
    },
  },
};
</script>

<style scoped>
.row {
  margin-top: -15px;
}
</style>
