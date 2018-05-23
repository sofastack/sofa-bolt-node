'use strict';

const Long = require('long');
const assert = require('assert');
const java = require('js-to-java');
const hessian = require('hessian.js-1');
const encoderV1 = require('hessian.js-1').encoderV1;
const encoderV2 = require('hessian.js-1').encoderV2;
const compile = require('../lib/codec/hessian/compile');
const classMap = require('./fixtures/class_map_1');

const versions = [ '1.0', '2.0' ];

function encode(obj, version, classMap, appClassMap) {
  const encoder = version === '2.0' ? encoderV2 : encoderV1;
  encoder.reset();
  if (classMap) {
    compile(obj, version, classMap)(obj.$, encoder, appClassMap);
  } else {
    encoder.write(obj);
  }
  return encoder.get();
}

describe('test/hessian.test.js', () => {
  versions.forEach(version => {
    describe(version, () => {
      it('should encode java.util.Map without generic', () => {
        const obj = {
          $class: 'java.util.Map',
          $: { foo: 'bar' },
          isMap: true,
        };
        const buf1 = hessian.encode({ $class: 'java.util.Map', $: { foo: 'bar' } }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);

        const map = new Map();
        map.set('foo', 'bar');
        obj.$ = map;
        const buf4 = hessian.encode({
          $class: 'java.util.Map',
          $: { foo: { $class: 'java.lang.String', $: 'bar' } },
        }, version);
        const buf5 = encode(obj, version, {});
        assert.deepEqual(buf4, buf5);

        const buf6 = encode(obj, version, {});
        assert.deepEqual(buf4, buf6);
      });

      it('should encode java.util.Map with generic', () => {
        const map = new Map();
        map.set(1, 'xxx');
        const obj = {
          $class: 'java.util.Map',
          $: map,
          generic: [{
            type: 'java.lang.Integer',
          }, {
            type: 'java.lang.String',
          }],
        };

        const converted = {
          $class: 'java.util.Map',
          $: new Map(),
        };
        converted.$.set({ $class: 'java.lang.Integer', $: 1 }, { $class: 'java.lang.String', $: 'xxx' });

        const buf1 = hessian.encode(converted, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);

        obj.$ = { 1: 'xxx' };
        const buf4 = hessian.encode(converted, version);
        const buf5 = encode(obj, version, {});
        assert.deepEqual(buf4, buf5);

        const buf6 = encode(obj, version, {});
        assert.deepEqual(buf4, buf6);
      });

      it('should encode java.util.List with generic', () => {
        const obj = {
          $class: 'java.util.List',
          $: [ 'foo', 'bar' ],
          generic: [
            'java.lang.String',
          ],
        };
        const buf1 = hessian.encode({
          $class: 'java.util.List',
          $: [{ $class: 'java.lang.String', $: 'foo' },
            { $class: 'java.lang.String', $: 'bar' },
          ],
        }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.List without generic', () => {
        const obj = {
          $class: 'java.util.List',
          $: [ 'foo', 'bar' ],
        };
        const buf1 = hessian.encode({ $class: 'java.util.List', $: [ 'foo', 'bar' ] }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.ArrayList with generic', () => {
        const obj = {
          $class: 'java.util.ArrayList',
          $: [ 'foo', 'bar' ],
          generic: [
            'java.lang.String',
          ],
        };
        const buf1 = hessian.encode({
          $class: 'java.util.ArrayList',
          $: [ 'foo', 'bar' ],
          generic: [ 'java.lang.String' ],
        }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.ArrayList without generic', () => {
        const obj = {
          $class: 'java.util.ArrayList',
          $: [ 'foo', 'bar' ],
        };
        const buf1 = hessian.encode({ $class: 'java.util.ArrayList', $: [ 'foo', 'bar' ] }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Set with generic', () => {
        const obj = {
          $class: 'java.util.Set',
          $: [ 'foo', 'bar' ],
          generic: [
            'java.lang.String',
          ],
        };
        const buf1 = hessian.encode({
          $class: 'java.util.Set',
          $: [{ $class: 'java.lang.String', $: 'foo' },
            { $class: 'java.lang.String', $: 'bar' },
          ],
        }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Set without generic', () => {
        const obj = {
          $class: 'java.util.Set',
          $: [ 'foo', 'bar' ],
        };
        const buf1 = hessian.encode({ $class: 'java.util.Set', $: [ 'foo', 'bar' ] }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode enum', () => {
        const obj = {
          $class: 'com.test.model.datum.DatumStaus',
          $: {
            code: 'PRERELEASING',
            name: 'PRERELEASING',
            message: '预发中',
            ordinal: 1,
            eql() {
              //
            },
          },
          isEnum: true,
        };
        const buf1 = hessian.encode({
          $class: 'com.test.model.datum.DatumStaus',
          $: { name: 'PRERELEASING' },
        }, version);
        const buf2 = encode(obj, version, {});
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, {});
        assert.deepEqual(buf1, buf3);
      });

      it('should encode class', () => {
        const obj = {
          $class: 'com.test.service.ctx.WebUniformContextInfo',
          $: {
            extend_props: {
              foo: 'bar',
            },
            pageUrl: 'pageUrl',
            uid: 'uid',
            jsessionId: 'jsessionId',
            pageParams: 'pageParams',
            ipGroup: 'ipGroup',
            business_type_id: 'business_type_id',
          },
        };
        const buf1 = hessian.encode({
          $class: 'com.test.service.ctx.WebUniformContextInfo',
          $: {
            pageUrl: { $class: 'java.lang.String', $: 'pageUrl' },
            uid: { $class: 'java.lang.String', $: 'uid' },
            jsessionId: { $class: 'java.lang.String', $: 'jsessionId' },
            pageParams: { $class: 'java.lang.String', $: 'pageParams' },
            ipGroup: { $class: 'java.lang.String', $: 'ipGroup' },
            from_msg: { $class: 'boolean', $: false },
            business_type_id: { $class: 'java.lang.String', $: 'business_type_id' },
            extend_props: { $class: 'java.util.Map', $: { foo: 'bar' } },
          },
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode class that isMap = true', () => {
        const obj = {
          $class: 'com.test.service.ctx.UniformContextHeaders',
          $: {
            serviceProperies: { foo: 'bar' },
          },
        };
        const buf1 = version === '1.0' ? hessian.encode({
          $class: 'com.test.service.ctx.UniformContextHeaders',
          $: {
            invokeId: null,
            serviceUniqueName: null,
            read: { $class: 'boolean', $: false },
            idempotent: { $class: 'boolean', $: false },
            batch: { $class: 'boolean', $: false },
            version: null,
            counter: null,
            ipGroup: null,
            caller: null,
            callee: null,
            webInfo: null,
            serviceProperies: { $class: 'java.util.Properties', $: { foo: 'bar' } },
            protocol: null,
            invokeType: null,
            from_msg: { $class: 'boolean', $: false },
          },
        }, version) : Buffer.from('4fba636f6d2e746573742e736572766963652e6374782e556e69666f726d436f6e74657874486561646572739f08696e766f6b6549641173657276696365556e697175654e616d6504726561640a6964656d706f74656e740562617463680776657273696f6e07636f756e74657207697047726f75700663616c6c65720663616c6c656507776562496e666f107365727669636550726f7065726965730870726f746f636f6c0a696e766f6b65547970650866726f6d5f6d73676f904e4e4646464e4e4e4e4e4e4d7400146a6176612e7574696c2e50726f7065727469657303666f6f036261727a4e4e46', 'hex');
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Date', () => {
        const obj = {
          $class: 'java.util.Date',
          $: new Date(),
        };
        const buf1 = hessian.encode(obj, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.lang.Class', () => {
        const obj = {
          $class: 'java.lang.Class',
          $: {
            name: '[java.lang.String',
          },
        };
        const buf1 = hessian.encode(obj, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Currency', () => {
        const obj = {
          $class: 'java.util.Currency',
          $: 'CNY',
        };
        const buf1 = hessian.encode({ $class: 'java.util.Currency', $: { currencyCode: 'CNY' } }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.math.BigDecimal', () => {
        const obj = {
          $class: 'java.math.BigDecimal',
          $: { value: '100.06' },
        };
        const buf1 = hessian.encode({ $class: 'java.math.BigDecimal', $: { value: '100.06' } }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode abstractClass', () => {
        const user = {
          $class: 'com.test.service.UserPrincipal',
          $: {
            name: 'name',
          },
        };
        const obj = {
          $class: 'java.security.Principal',
          $abstractClass: 'java.security.Principal',
          $: user,
        };
        const buf1 = hessian.encode({
          $abstractClass: 'java.security.Principal',
          $class: 'com.test.service.UserPrincipal',
          $: { name: 'name' },
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Collection', () => {
        const classMap = {
          'com.test.service.PermissionQuery': {
            vAccountId: {
              type: 'java.lang.String',
              isFinal: true,
            },
            personId: {
              type: 'java.lang.String',
              isFinal: true,
            },
            packageNames: {
              type: 'java.util.Collection',
              isFinal: true,
              abstractClass: 'java.util.Collection',
              generic: [
                { type: 'java.lang.String' },
              ],
            },
            roleNames: {
              type: 'java.util.Collection',
              isFinal: true,
              abstractClass: 'java.util.Collection',
              generic: [
                { type: 'java.lang.String' },
              ],
            },
            featureNames: {
              type: 'java.util.Collection',
              isFinal: true,
              abstractClass: 'java.util.Collection',
              generic: [
                { type: 'java.lang.String' },
              ],
            },
            featureParams: {
              type: 'java.util.Map',
              isFinal: true,
              generic: [
                { type: 'java.lang.String' },
                { generic: [{ type: 'java.lang.String' }], type: 'java.util.Collection' },
              ],
            },
            filters: {
              type: 'java.util.Collection',
              isFinal: true,
              abstractClass: 'java.util.Collection',
              generic: [
                { type: 'java.lang.String' },
              ],
            },
          },
        };
        const queries = [{
          vAccountId: '200012245',
          personId: null,
          packageNames: null,
          roleNames: null,
          featureNames: [ 'China_GS', 'China_Free' ],
          featureParams: null,
          filters: null,
        }];
        const obj = {
          $class: 'java.util.Collection',
          $: queries,
          $abstractClass: 'java.util.Collection',
          generic: [{ type: 'com.test.service.PermissionQuery' }],
        };

        const buf1 = hessian.encode({
          $class: 'java.util.Collection',
          $: [{
            $class: 'com.test.service.PermissionQuery',
            $: {
              vAccountId: {
                $class: 'java.lang.String',
                $: '200012245',
              },
              personId: null,
              packageNames: null,
              roleNames: null,
              featureNames: {
                $class: 'java.util.Collection',
                $: [
                  { $class: 'java.lang.String', $: 'China_GS' },
                  { $class: 'java.lang.String', $: 'China_Free' },
                ],
              },
              featureParams: null,
              filters: null,
            },
          }],
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('classMap 中含有子类申明时, 子类类型不能丢掉', () => {
        const classMap = {
          'com.test.service.facade.model.triggerrequests.Request': {},
          'com.test.service.facade.model.triggerrequests.UserTriggerRequest': {
            specifiedPrize: {
              type: 'com.alipay.promocore.common.service.facade.model.camp.trigger.SpecifiedPrize',
            },
            prizeId: {
              type: 'java.lang.String',
            },
            type: {
              type: 'com.test.service.facade.events.TriggerType',
              defaultValue: 'User',
              isEnum: true,
            },
            campaignId: {
              type: 'java.lang.String',
            },
            userId: {
              type: 'java.lang.String',
            },
            seedId: {
              type: 'java.lang.String',
            },
            requestContext: {
              type: 'java.util.Map',
              defaultValue: {},
              generic: [
                { type: 'java.lang.String' },
                { type: 'java.lang.Object' },
              ],
            },
            transferProps: {
              type: 'java.util.Map',
              defaultValue: {},
              generic: [
                { type: 'java.lang.String' },
                { type: 'java.lang.String' },
              ],
            },
            gmtDt: {
              type: 'java.util.Date',
              defaultValue: 1471096717898,
            },
            idempotentNo: {
              type: 'java.lang.String',
            },
            idempotent: {
              type: 'boolean',
              defaultValue: false,
            },
          },
        };
        const userId = 'x';
        const campaignId = 'a';
        const request = {
          $class: 'com.test.service.facade.model.triggerrequests.UserTriggerRequest',
          $: {
            userId,
            campaignId,
            requestContext: { termId: 'd' },
            transferProps: { fundOrderId: 'o' },
          },
        };
        const obj = {
          $class: 'com.test.service.facade.model.triggerrequests.Request',
          $abstractClass: 'com.test.service.facade.model.triggerrequests.Request',
          $: request,
        };

        const buf1 = hessian.encode({
          $class: 'com.test.service.facade.model.triggerrequests.UserTriggerRequest',
          $: {
            specifiedPrize: null,
            prizeId: null,
            type: { $class: 'com.test.service.facade.events.TriggerType', $: { name: 'User' } },
            campaignId: { $class: 'java.lang.String', $: 'a' },
            userId: { $class: 'java.lang.String', $: 'x' },
            seedId: null,
            requestContext: { $class: 'java.util.Map', $: { termId: 'd' } },
            transferProps: {
              $class: 'java.util.Map',
              $: {
                fundOrderId: { $class: 'java.lang.String', $: 'o' },
              },
            },
            gmtDt: { $class: 'java.util.Date', $: 1471096717898 },
            idempotentNo: null,
            idempotent: { $class: 'boolean', $: false },
          },
          $abstractClass: 'com.test.service.facade.model.triggerrequests.Request',
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('#convert() abstractClass manual appoint 2.', () => {
        const user = {
          $class: 'com.test.service.UserPrincipal',
          $: {
            name: 'name',
            test: null,
          },
        };
        const obj = {
          $class: 'java.util.Map',
          $: {
            value: {
              $class: 'java.security.Principal',
              $abstractClass: 'java.security.Principal',
              $: user,
            },
          },
        };
        const buf1 = hessian.encode({
          $class: 'java.util.Map',
          $: {
            value: {
              $abstractClass: 'java.security.Principal',
              $class: 'com.test.service.UserPrincipal',
              $: { name: 'name', test: null },
            },
          },
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('#convert() abstractClass manual appoint 21.', () => {
        const classMap = {
          'com.test.service.MethodParam': {
            value: {
              type: 'java.security.Principal',
              $abstractClass: 'java.security.Principal',
            },
          },
        };
        const user = {
          $class: 'com.test.service.UserPrincipal',
          $: {
            name: 'name',
            test: null,
          },
        };
        const obj = {
          $class: 'com.test.service.MethodParam',
          $: [
            { value: user },
          ],
          isArray: true,
        };
        const buf1 = hessian.encode({
          $class: '[com.test.service.MethodParam',
          $: [{
            $class: 'com.test.service.MethodParam',
            $: {
              value: {
                $abstractClass: 'java.security.Principal',
                $class: 'com.test.service.UserPrincipal',
                $: { name: 'name', test: null },
              },
            },
          }],
        }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      it('should encode java.util.Locale', () => {
        const obj = {
          $class: 'java.util.Locale',
          $: 'zh_CN',
        };
        const buf1 = hessian.encode({ $class: 'com.caucho.hessian.io.LocaleHandle', $: { value: 'zh_CN' } }, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);
      });

      // it('should encode java.lang.Exception', () => {
      //   const err = new Error('mock');
      //   const buf1 = hessian.encode(java.exception(err), version);
      //   const buf2 = encode({
      //     $class: 'java.lang.Exception',
      //     $: err,
      //   }, version, {});
      //   assert.deepEqual(buf1, buf2);

      //   const buf3 = encode({
      //     $class: 'java.lang.Exception',
      //     $: err,
      //   }, version, {});
      //   assert.deepEqual(buf1, buf3);

      //   const buf4 = encode(java.exception(err), version, {});
      //   assert.deepEqual(buf1, buf4);
      // });

      describe('primitive types', () => {
        [
          [ 'boolean', true ],
          [ 'java.lang.Boolean', false ],
          [ 'int', 10 ],
          [ 'java.lang.Integer', 1000 ],
          [ 'short', 7 ],
          [ 'java.lang.Short', 9 ],
          [ 'long', Date.now() ],
          [ 'java.lang.Long', Date.now() ],
          [ 'double', 9.99 ],
          [ 'java.lang.Double', 100.1 ],
          [ 'float', 20.2 ],
          [ 'java.lang.Float', 7.77 ],
          [ 'byte', 1 ],
          [ 'java.lang.Byte', 0 ],
          [ 'char', 's' ],
          [ 'java.lang.Character', 'S' ],
          [ 'java.lang.String', 'hello world' ],
        ].forEach(item => {
          it('should encode ' + item[0], () => {
            const obj = {
              $class: item[0],
              $: item[1],
            };
            const buf1 = hessian.encode(obj, version);
            const buf2 = encode(obj, version, classMap);
            assert.deepEqual(buf1, buf2);

            const buf3 = encode(obj, version, classMap);
            assert.deepEqual(buf1, buf3);
          });
        });
      });

      describe('array', () => {
        it('should encode array', () => {
          const obj = {
            $class: 'int',
            $: [ 1, 2, 3 ],
            isArray: true,
          };
          const buf1 = hessian.encode({ $class: '[int', $: [{ $class: 'int', $: 1 }, { $class: 'int', $: 2 }, { $class: 'int', $: 3 }] }, version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode multi-dimentional array', () => {
          const obj = {
            $class: 'java.lang.String',
            $: [
              [ null, 'a', '1' ],
            ],
            isArray: true,
            arrayDepth: 2,
          };
          const buf1 = hessian.encode({
            $class: '[[java.lang.String',
            $: [{
              $class: '[java.lang.String',
              $: [
                { $class: 'java.lang.String', $: null },
                { $class: 'java.lang.String', $: 'a' },
                { $class: 'java.lang.String', $: '1' },
              ],
            }],
          }, version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode java.lang.Class array', () => {
          const obj = {
            $class: 'java.lang.Class',
            $: [{
              name: '[java.lang.String',
            }, '[Ljava.lang.String;', '[Ljava.lang.String' ],
            isArray: true,
          };
          const buf1 = hessian.encode({
            $class: '[java.lang.Class',
            $: [{
              $class: 'java.lang.Class',
              $: { name: '[java.lang.String' },
            }, {
              $class: 'java.lang.Class',
              $: { name: '[Ljava.lang.String;' },
            }, {
              $class: 'java.lang.Class',
              $: { name: '[Ljava.lang.String;' },
            }],
          }, version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode java.util.Locale array', () => {
          const obj = {
            $class: 'java.util.Locale',
            $: [
              'zh_CN',
              'en_US',
            ],
            isArray: true,
          };
          const buf1 = hessian.encode({
            $class: '[com.caucho.hessian.io.LocaleHandle',
            $: [
              { $class: 'com.caucho.hessian.io.LocaleHandle', $: { value: 'zh_CN' } },
              { $class: 'com.caucho.hessian.io.LocaleHandle', $: { value: 'en_US' } },
            ],
          }, version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode java.math.BigDecimal array', () => {
          const obj = {
            $class: 'java.math.BigDecimal',
            $: [
              '100.06',
              '200.07',
            ],
            isArray: true,
          };
          const buf1 = hessian.encode(java.array.BigDecimal(obj.$), version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode java.util.Currency array', () => {
          const obj = {
            $class: 'java.util.Currency',
            $: [
              'CNY',
              'USD',
            ],
            isArray: true,
          };
          const buf1 = hessian.encode({
            $class: '[java.util.Currency',
            $: [
              { $class: 'java.util.Currency', $: { currencyCode: 'CNY' } },
              { $class: 'java.util.Currency', $: { currencyCode: 'USD' } },
            ],
          }, version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode byte array', () => {
          const obj = {
            $class: 'byte',
            $: new Buffer('hello world'),
            isArray: true,
          };
          const buf1 = hessian.encode(new Buffer('hello world'), version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });

        it('should encode java.lang.Byte array', () => {
          const obj = {
            $class: 'java.lang.Byte',
            $: new Buffer('hello world'),
            isArray: true,
          };
          const buf1 = hessian.encode(new Buffer('hello world'), version);
          const buf2 = encode(obj, version, {});
          assert.deepEqual(buf1, buf2);

          const buf3 = encode(obj, version, {});
          assert.deepEqual(buf1, buf3);
        });
      });

      describe('java.lang.Object', () => {
        [
          [ 'boolean', true ],
          [ 'java.lang.Boolean', false ],
          [ 'int', 10 ],
          [ 'java.lang.Integer', 1000 ],
          [ 'short', 7 ],
          [ 'java.lang.Short', 9 ],
          [ 'long', Date.now() ],
          [ 'java.lang.Long', Date.now() ],
          [ 'double', 9.99 ],
          [ 'java.lang.Double', 100.1 ],
          [ 'float', 20.2 ],
          [ 'java.lang.Float', 7.77 ],
          [ 'byte', 1 ],
          [ 'java.lang.Byte', 0 ],
          [ 'char', 's' ],
          [ 'java.lang.Character', 'S' ],
          [ 'java.lang.String', 'hello world' ],
          [ 'java.util.Map', { foo: 'bar' }],
          [ 'java.util.HashMap', { foo: 'bar' }],
          [ 'java.util.Date', new Date() ],
          [ 'array', [ 1, 2 ]],
          [ 'buffer', new Buffer('hello world') ],
          [ 'long', Long.ZERO ],
          [ 'null', null ],
        ].forEach(item => {
          it('should encode ' + item[0], () => {
            const obj = {
              $class: 'java.lang.Object',
              $: item[1],
            };
            const buf1 = hessian.encode(item[1], version);
            const buf2 = encode(obj, version, classMap);
            assert.deepEqual(buf1, buf2);

            const buf3 = encode(obj, version, classMap);
            assert.deepEqual(buf1, buf3);
          });
        });
      });

      it('should encode complex object', () => {
        const obj = {
          $class: 'com.alipay.test.TestObj',
          $: {
            b: true,
            name: 'testname',
            field: 'xxxxx',
            testObj2: { name: 'xxx', finalField: 'xxx' },
            testEnum: { name: 'B' },
            testEnum2: [{ name: 'B' }, { name: 'C' }],
            bs: new Buffer([ 0x02, 0x00, 0x01, 0x07 ]),
            list1: [{ name: 'A' }, { name: 'B' }],
            list2: [ 2017, 2016 ],
            list3: [{ name: 'aaa', finalField: 'xxx' },
              { name: 'bbb', finalField: 'xxx' },
            ],
            list4: [ 'xxx', 'yyy' ],
            list5: [ new Buffer([ 0x02, 0x00, 0x01, 0x07 ]), new Buffer([ 0x02, 0x00, 0x01, 0x06 ]) ],
            map1: { 2017: { name: 'B' } },
            map2: new Map([
              [ 2107, 2016 ],
            ]),
            map3: {},
            map4: { xxx: 'yyy' },
            map5: { 2017: new Buffer([ 0x02, 0x00, 0x01, 0x06 ]) },
          },
        };

        const converted = {
          $class: 'com.alipay.test.TestObj',
          $: {
            b: { $class: 'boolean', $: true },
            testObj2: { $class: 'com.alipay.test.sub.TestObj2', $: { name: { $class: 'java.lang.String', $: 'xxx' }, finalField: { $class: 'java.lang.String', $: 'xxx' } } },
            name: { $class: 'java.lang.String', $: 'testname' },
            field: { $class: 'java.lang.String', $: 'xxxxx' },
            testEnum: { $class: 'com.alipay.test.TestEnum', $: { name: 'B' } },
            testEnum2: {
              $class: '[com.alipay.test.TestEnum',
              $: [{ $class: 'com.alipay.test.TestEnum', $: { name: 'B' } },
                { $class: 'com.alipay.test.TestEnum', $: { name: 'C' } },
              ],
            },
            bs: new Buffer([ 0x02, 0x00, 0x01, 0x07 ]),
            list1: { $class: 'java.util.List', $: [{ $class: 'com.alipay.test.TestEnum', $: { name: 'A' } }, { $class: 'com.alipay.test.TestEnum', $: { name: 'B' } }] },
            list2: { $class: 'java.util.List', $: [{ $class: 'java.lang.Integer', $: 2017 }, { $class: 'java.lang.Integer', $: 2016 }] },
            list3: {
              $class: 'java.util.List',
              $: [
                { $class: 'com.alipay.test.sub.TestObj2', $: { name: { $class: 'java.lang.String', $: 'aaa' }, finalField: { $class: 'java.lang.String', $: 'xxx' } } },
                { $class: 'com.alipay.test.sub.TestObj2', $: { name: { $class: 'java.lang.String', $: 'bbb' }, finalField: { $class: 'java.lang.String', $: 'xxx' } } },
              ],
            },
            list4: { $class: 'java.util.List', $: [{ $class: 'java.lang.String', $: 'xxx' }, { $class: 'java.lang.String', $: 'yyy' }] },
            list5: {
              $class: 'java.util.List',
              $: [
                new Buffer([ 0x02, 0x00, 0x01, 0x07 ]), new Buffer([ 0x02, 0x00, 0x01, 0x06 ]),
              ],
            },
            map1: {
              $class: 'java.util.Map',
              $: new Map([
                [{ $class: 'java.lang.Long', $: 2017 }, { $class: 'com.alipay.test.TestEnum', $: { name: 'B' } }],
              ]),
            },
            map2: {
              $class: 'java.util.Map',
              $: new Map([
                [{ $class: 'java.lang.Integer', $: 2107 }, { $class: 'java.lang.Integer', $: 2016 }],
              ]),
            },
            map3: { $class: 'java.util.Map', $: {} },
            map4: { $class: 'java.util.Map', $: { xxx: { $class: 'java.lang.String', $: 'yyy' } } },
            map5: { $class: 'java.util.Map', $: { 2017: new Buffer([ 0x02, 0x00, 0x01, 0x06 ]) } },
          },
        };
        const buf1 = hessian.encode(converted, version);
        const buf2 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf2);

        const buf3 = encode(obj, version, classMap);
        assert.deepEqual(buf1, buf3);

        const buf4 = encode(converted, version);
        assert.deepEqual(buf1, buf4);
      });
    });
  });
});
