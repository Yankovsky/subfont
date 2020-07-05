const expect = require('./expect');

describe('reference images', function () {
  for (const inlineCss of [true, false]) {
    describe(`with inlineCss:${inlineCss}`, function () {
      for (const inlineFonts of [true, false]) {
        describe(`with inlineFonts:${inlineFonts}`, function () {
          for (const omitFallbacks of [true, false]) {
            describe(`with omitFallbacks:${omitFallbacks}`, function () {
              it('should render a simple test case without ligatures', async function () {
                await expect(
                  'withoutLigatures',
                  'to render the same after subsetting',
                  {
                    inlineCss,
                    inlineFonts,
                    omitFallbacks,
                  }
                );
              });

              it('should render ligatures correctly', async function () {
                await expect(
                  'ligatures',
                  'to render the same after subsetting',
                  {
                    inlineCss,
                    inlineFonts,
                    omitFallbacks,
                  }
                );
              });
            });
          }
        });
      }
    });
  }
});
