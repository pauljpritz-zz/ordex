<template>
  <div id="wrapper">
    <router-link to="/">
      <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    </router-link>
      <form novalidate class="md-layout" @submit.prevent="validateOrder">
        <md-card class="md-layout-item md-size-80 md-small-size-100">
          <md-card-header>
            <div class="md-title">Exchange tokens</div>
          </md-card-header>

          <pulse-loader v-if="loading"></pulse-loader>

          <md-card-content  v-if="!loading">

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('sourceToken')">
                  <label for="source-token">Source token</label>
                  <md-select name="source-token" id="source-token" v-model="form.sourceToken" md-dense :disabled="sending">
                    <md-option></md-option>
                    <md-option
                      v-for="token in tokens"
                      v-if="token.address !== form.targetToken"
                      :key="token.address"
                      v-bind:value="token.address">{{ token.name }}</md-option>
                  </md-select>
                  <span class="md-error" v-if="!$v.form.sourceToken.required">The source token required</span>
                </md-field>
              </div>

              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('sourceAmount')">
                  <label for="last-name">Source amount</label>
                  <md-input type="number" id="source-amount" name="source-amount" v-model.number="form.sourceAmount" :disabled="sending" />
                  <span class="md-error" v-if="!$v.form.sourceAmount.required">The source amount required</span>
                  <span class="md-error" v-else-if="!$v.form.sourceAmount.minvalue">Amount should be greater than 0</span>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('targetToken')">
                  <label for="target-token">Target token</label>
                  <md-select name="target-token" id="target-token" v-model="form.targetToken" md-dense :disabled="sending">
                    <md-option></md-option>
                    <md-option
                      v-for="token in tokens"
                      v-if="token.address !== form.sourceToken"
                      :key="token.address"
                      v-bind:value="token.address">{{ token.name }}</md-option>
                  </md-select>
                  <span class="md-error" v-if="!$v.form.targetToken.required">The target token required</span>
                </md-field>
              </div>

              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('targetAmount')">
                  <label for="last-name">Target amount</label>
                  <md-input type="number" id="target-amount" name="target-amount" v-model.number="form.targetAmount" :disabled="sending" />
                  <span class="md-error" v-if="!$v.form.targetAmount.required">The target amount required</span>
                  <span class="md-error" v-else-if="!$v.form.targetAmount.minvalue">Amount should be greater than 0</span>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-small-size-100 no-border">
                <md-field :class="getValidationClass('expiryDate')">
                  <md-datepicker v-model="form.expiryDate">
                    <label>Expiry date</label>
                  </md-datepicker>
                </md-field>
              </div>

              <div class="md-layout-item md-small-size-100">
                <md-field :class="getValidationClass('expiryTime')">
                <el-time-picker
                  v-model="form.expiryTime"
                  placeholder="Expiry time"></el-time-picker>
                </md-field>
              </div>
            </div>

          </md-card-content>

          <md-progress-bar md-mode="indeterminate" v-if="sending" />

          <md-snackbar
            :md-duration="10000"
            :md-active.sync="showError">
            <span>Could not place the order, please try again later</span>
            <md-button class="md-primary" @click="showError = false">Close</md-button>
          </md-snackbar>

          <md-card-actions>
            <button type="submit" class="button" :disabled="sending">Place order</button>
          </md-card-actions>
        </md-card>
      </form>
  </div>
</template>

<script>
import { validationMixin } from 'vuelidate';
import {
  required,
  minValue,
} from 'vuelidate/lib/validators';

import { getTokens } from '../http';
import { sendOrder } from '../order-handler';
import store from '../store';
import router from '../router';

export default {
  name: 'ExchangeTokens',
  mixins: [validationMixin],
  mounted() {
    getTokens().then((tokens) => {
      this.tokens = tokens;
      this.loading = false;
    });
  },
  data() {
    return {
      loading: true,
      orderPlaced: false,
      sending: false,
      showError: false,
      form: {
        sourceToken: null,
        sourceAmount: null,
        targetToken: null,
        targetAmount: null,
      },
    };
  },
  validations: {
    form: {
      sourceToken: {
        required,
      },
      sourceAmount: {
        required,
        minValue: minValue(1),
      },
      targetToken: {
        required,
      },
      targetAmount: {
        required,
        minValue: minValue(1),
      },
    },
  },
  methods: {
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];
      if (field) {
        return {
          'md-invalid': field.$invalid && field.$dirty,
        };
      }
      return {};
    },
    validateOrder() {
      this.$v.$touch();

      if (!this.$v.$invalid) {
        let expiry;
        if (this.form.expiryDate) {
          expiry = new Date(
            this.form.expiryDate.getFullYear(),
            this.form.expiryDate.getMonth(),
            this.form.expiryDate.getDate(),
          );
          if (this.form.expiryTime) {
            expiry.setHours(this.form.expiryTime.getHours());
            expiry.setMinutes(this.form.expiryTime.getMinutes());
            expiry.setSeconds(this.form.expiryTime.getSeconds());
          }
          expiry = expiry.getDate();
        }
        const { expiryDate, expiryTime, ...payload } = Object.assign({
          address: store.account,
          expiry,
        }, this.form);

        this.sending = true;

        sendOrder(payload).then(() => {
          router.replace({ path: '/', query: { success: 'order' } });
        }).catch(() => {
          this.sending = false;
          this.showError = true;
        });
      }
    },
  },
};
</script>

<style lang="scss">
.no-border {
  & > .md-field.md-theme-default::after {
    background-color: transparent;
  }
}

.el-input {
  .el-input__inner {
    color: rgba(0,0,0,0.87);
    border: none;
    &::placeholder {
      color: rgba(0,0,0,0.54);
    }
  }

  .el-input__icon {
    color: rgba(0,0,0,0.54);
  }
}

.md-field .md-field {
  margin: 0;
  padding-top: 8px;
  min-height: 0;
  &:not(.md-has-value) label {
    top: 8px;
  }
  .md-input-action {
    top: 8px;
  }
}

.el-time-panel__btn.confirm {
  color: var(--md-theme-default-primary);
}

</style>
