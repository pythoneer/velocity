/*jshint -W117, -W030 */
/* global
 Future: true
 */

(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////
// Meteor Methods
//

  var Future;
  Meteor.startup(function () {
    Future = Npm.require('fibers/future');
  });

  Meteor.methods({

    /**
     * Meteor method: velocityResetDatabase
     * This truncate all collections in the app by using the native mongo object and calling collection.remove()
     *
     * @method velocityResetDatabase
     */
    velocityResetDatabase: function () {

      // safety check
      if (!process.env.IS_MIRROR) {
        console.err('[velocity] velocityReset is not allowed outside of a mirror. Something has gone wrong. Contact the Velocity team.');
        return false;
      }

      // Set up a future
      var fut = new Future();

      var collectionsRemoved = 0;
      var db = VelocityLogs.find()._mongo.db;
      db.collections(function (err, collections) {

        var appCollections = _.reject(collections, function (col) {
          return col.collectionName.indexOf('velocity') === 0 || col.collectionName === 'system.indexes';
        });

        _.each(appCollections, function (appCollection) {
          appCollection.remove(function (e) {
            if (e) {
              fut['return']('fail: ' + e);
            }
            collectionsRemoved++;
            if (appCollections.length === collectionsRemoved) {
              fut['return']('success');
            }
          });
        });

      });

      return fut.wait();

    } // end velocityResetDatabase

  });

})();
