<template>
  <v-container>
    <v-toolbar color="primary" cards dark flat>
      <v-card-title class="col-8 title font-weight-regular">
        Revisão Manual Validação
      </v-card-title>
      <v-select
        class="pt-5"
        v-model="manual_review.period"
        :items="periodos"
        label="Periodo"
      ></v-select>
    </v-toolbar>

    <v-form ref="form" class="pa-4 pt-4">
      <h5 style="margin-bottom: 30px">
        {{ manual_review.verification }}
      </h5>

      <v-radio-group
        @change="onChangeManualResult($event)"
        v-model="manual_review.manual_result"
        row
        :rules="[(v) => !!v || 'Selecione uma opção.']"
      >
        <div class="row" style="justify-content: space-between">
          <v-radio label="Compliance" value="1"></v-radio>
          <v-radio label="Não Compliance" value="2"></v-radio>
          <v-radio label="N/A" value="3"></v-radio>
        </div>
      </v-radio-group>

      <v-select
        v-model="manual_review.automated_result"
        :items="items"
        item-value="value"
        item-text="text"
        label="Resultado Automático"
        disabled
      ></v-select>
      <v-select
        v-model="manual_review.root_cause_id"
        :items="root_causes"
        label="Causa raiz"
        v-if="manual_review.manual_result == 2"
      ></v-select>
    </v-form>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn text @click="closeDialog()"> Cancelar </v-btn>
      <v-spacer></v-spacer>
      <v-btn class="white--text" color="primary" @click="saveDialog()"> Salvar </v-btn>
    </v-card-actions>
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

export default {
  data() {
    return {
      manual_review: {
        sise_key: "",
        validation_id: "",
        automated_result: "",
        manual_result: null,
        root_cause_id: null,
        user: "",
        created_at: "",
        verification: null,
        period: null,
      },
      coverage_id: "",
      items: [
        { text: "COMPLIANCE", value: 1 },
        { text: "NON COMPLIANCE", value: 0 },
      ],
      root_causes: [],
      periodos: [],
      dialog: false,
      error_dialog: false,
      error_text: "",
      validateRootCause: [
        (v) => {
          if (this.manual_review.manual_result == "0") {
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
    onChangeManualResult($event) {
      if ($event == 2) {
        this.fetchRootCauses({
          coverage_id: this.coverage_id,
          validation_id: this.manual_review.validation_id,
        });
      }
    },
    //payload = {coverage_id = val, validation_id = val}

    fetchRootCauses(payload) {
      console.log("payload", payload);
      this.dialog = true;
      let uri = `${config.HEROKU_URL}/rootcauses_coverage`;
      if (payload) {
        uri += `?coverage_id=${payload.coverage_id}&validation_id=${payload.validation_id}`;
      }
      axios
        .get(uri)
        .then((response) => {
          this.root_causes = response.data.map((c) => ({
            value: c.root_cause_id,
            text: c.description_pt_br,
          }));
          this.dialog = false;
        })

        .catch((error) => {
          this.dialog = false;
          this.error_text = `Erro ao recuperar lista de causas. ${error.message}`;
          this.error_dialog = true;
          throw error;
        });
    },
    closeDialog() {
      tableau.extensions.ui.closeDialog();
    },
    saveDialog() {
      if (this.$refs.form.validate()) {
        this.manual_review.created_at = new Date(Date.now()).toISOString().split(".")[0];
        this.dialog = true;
        let url = `${config.HEROKU_URL}/manual_review_validation_motor`;
        console.log(this.manual_review);
        axios
          .post(url, this.manual_review)
          .then(() => {
            //atualiza os datasources que são live
            const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
              (w) => w.name === tableau.extensions.settings.get("VALIDATION_WORKSHEET")
            );
            worksheet
              .getDataSourcesAsync()
              .then((datasources) => {
                const datasource = datasources.find(
                  (d) =>
                    d.name ===
                    tableau.extensions.settings.get("VALIDATION_DATASOURCE_TO_REFRESH")
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
  mounted() {
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
      // console.log(dataTable)
      ref.manual_review.user = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_USER_FIELD")
      );
      ref.manual_review.sise_key = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_SISE_KEY_FIELD")
      );
      ref.manual_review.automated_result = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_AUTOMATED_RESULT_FIELD")
      );
      ref.coverage_id = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_COVERAGE_ID_FIELD")
      );
      ref.manual_review.validation_id = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("VALIDATION_VALIDATION_ID_FIELD")
      );
      ref.manual_review.verification = ref.getValueFromDataTable(
        dataTable,
        tableau.extensions.settings.get("MANUAL_REVIEW_VERIFICATION")
      );
      ref.manual_review.created_at = new Date(Date.now()).toISOString();
      console.log(ref.manual_review);
    });
  },
};
</script>

<style scoped></style>
