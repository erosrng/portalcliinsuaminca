import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BSYZDUYN.js";
import "./chunk-CY6CPK42.js";
import "./chunk-QLCDNBZR.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-LOHZWL44.js";
import "./chunk-TX6E4IQG.js";
import "./chunk-MN2M74Y4.js";
import "./chunk-T2QHIGVT.js";
import "./chunk-AIPAVXOR.js";
import "./chunk-SXWFUD7F.js";
import "./chunk-IYFC5GTT.js";
import "./chunk-4KH2YRAM.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-P5JOZLIX.js";
import "./chunk-5CZHM5UE.js";
import "./chunk-HVXKUZPN.js";
import "./chunk-OHWI2S6G.js";
import "./chunk-SVVIGFXE.js";
import "./chunk-7UEM56OK.js";
import "./chunk-DHR5YDJI.js";
import "./chunk-UF2CGQV3.js";
import "./chunk-IJ3KGSPX.js";
import "./chunk-J4JDRUFQ.js";
import "./chunk-LR32L5Z3.js";
import "./chunk-Q5GE6IRN.js";
import "./chunk-V2R7SCBH.js";
import "./chunk-RYZWFTBI.js";
import "./chunk-HDHCX5MQ.js";
import "./chunk-OFWNEWDS.js";
import "./chunk-7MFUTISS.js";
import "./chunk-JSWM5O77.js";
import "./chunk-PEBH6BBU.js";
import "./chunk-WPM5VTLQ.js";
import "./chunk-4S3KYZTJ.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanelWrap', [
  //   transition('* => void', query('@transformPanel', [animateChild()], {optional: true})),
  // ])
  /**
   * This animation ensures the select's overlay panel animation (transformPanel) is called when
   * closing the select.
   * This is needed due to https://github.com/angular/angular/issues/23302
   */
  transformPanelWrap: {
    type: 7,
    name: "transformPanelWrap",
    definitions: [{
      type: 1,
      expr: "* => void",
      animation: {
        type: 11,
        selector: "@transformPanel",
        animation: [{
          type: 9,
          options: null
        }],
        options: {
          optional: true
        }
      },
      options: null
    }],
    options: {}
  },
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [{
      type: 0,
      name: "void",
      styles: {
        type: 6,
        styles: {
          opacity: 0,
          transform: "scale(1, 0.8)"
        },
        offset: null
      }
    }, {
      type: 1,
      expr: "void => showing",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 1,
            transform: "scale(1, 1)"
          },
          offset: null
        },
        timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
      },
      options: null
    }, {
      type: 1,
      expr: "* => void",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 0
          },
          offset: null
        },
        timings: "100ms linear"
      },
      options: null
    }],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
