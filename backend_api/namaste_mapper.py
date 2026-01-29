import csv
import time
from google import genai

#  Gemini API key
API_KEY = "AIzaSyBCum9UQB4-5gBRWLdZiVRsDSu9A4zCpGk"
client = genai.Client(api_key=API_KEY)

# TM2 list as a single string
tm2_list_string = """
SK50 Scalp affliction disorder (TM2)
SK51 Cervicobrachial pain disorder (TM2)
SK52 Tremor disorder (TM2)
SK53 Stammering disorder (TM2)
SK54 Numbness disorder (TM2)
SK55 Weakness of thighs due to vata disorder (TM2)
SK5Y Other specified head, brain, nerve and movement disorders (TM2)
SK5Z Head, brain, nerve and movement disorders (TM2), unspecified
SL20 Excessive sneezing disorder (TM2)
SL21 Hypernasal speech disorder (TM2)
SL2Y Other specified eye, ear, nose, throat and neck disorders (TM2)
SL2Z Eye, ear, nose, throat and neck disorders (TM2), unspecified
SL40 Bronchial asthma disorder (TM2)
SL41 Cough disorder (TM2)
SL42 Dyspnoea disorder (TM2)
SL4Y Other specified respiratory system disorders (TM2)
SL4Z Respiratory system disorders (TM2), unspecified
SM00 Lymphadenopathy disorder (TM2)
SM01 Elephantiasis disorder (TM2)
SM0Y Other specified heart, blood and circulatory disorders (TM2)
SM0Z Heart, blood and circulatory disorders (TM2), unspecified
SM10 Stomatitis disorder (TM2)
SM11 Dental abscess disorder (TM2)
SM12 Bruxism disorder (TM2)
SM13 Pyorrhoea disorder (TM2)
SM14 Gingivitis disorder (TM2)
SM15 Halitosis disorder (TM2)
SM16 Sialorrhoea disorder (TM2)
SM17 Palatitis disorder (TM2)
SM18 Uvulitis disorder (TM2)
SM19 Ludwig’s angina disorder (TM2)
SM1A Odontalgia disorder (TM2)
SM1B Bleeding gum disorder (TM2)
SM1C Ranula disorder (TM2)
SM1D Parotitis disorder (TM2)
SM1E Dental caries disorder (TM2)
SM1F Dental plaque disorder (TM2)
SM1G Discolouration of teeth disorder (TM2)
SM1H Odontoseisis disorder (TM2)
SM1J Sensitive teeth disorder (TM2)
SM1K Lip chapping and bleeding disorder (TM2)
SM1L Itchy swollen lip diorder (TM2)
SM1M Dry chapped lip disorder (TM2)
SM1N Xerostomia disorder (TM2)
SM1P Ageusia disorder (TM2)
SM1Y Other specified oral cavity disorders (TM2)
SM1Z Oral cavity disorders (TM2), unspecified
SM30 Haematemesis disorder (TM2)
SM31 Abdominal distension disorder (TM2)
SM32 Ascites disorder (TM2)
SM33 Abdominal pain disorder (TM2)
SM34 Constipation disorder (TM2)
SM35 Volvulus disorder (TM2)
SM36 Malabsorption disorder (TM2)
SM37 Diarrhoea disorder (TM2)
SM38 Dysentery disorder (TM2)
SM39 Dyspepsia disorder (TM2)
SM3A Hyperacidity disorder (TM2)
SM3B Indigestion disorder (TM2)
SM3C Food stasis indigestion disorder (TM2)
SM3D Duodenal ulcer disorder (TM2)
SM3E Gastric ulcer disorder (TM2)
SM3F Gastritis disorder (TM2)
SM3G Hernia disorder (TM2)
SM3H Nausea disorder (TM2)
SM3J Retching disorder (TM2)
SM3K Abdominal lumps disorder (TM2)
SM3L Vomiting disorder (TM2)
SM3Y Other specified abdominal cavity disorders (TM2)
SM3Z Abdominal cavity disorders (TM2), unspecified
SM40 Liver abscess disorder (TM2)
SM41 Jaundice disorder (TM2)
SM42 Hepatomegaly disorder (TM2)
SM43 Hepatitis disorder (TM2)
SM44 Splenomegaly disorder (TM2)
SM4Y Other specified liver and Spleen disorders (TM2)
SM4Z Liver and Spleen disorders (TM2), unspecified
SM50 Proctalgia disorder (TM2)
SM51 Anal fissure disorder (TM2)
SM52 Fistula in ano disorder (TM2)
SM53 Haemorrhoids disorder (TM2)
SM54 Proctitis disorder (TM2)
SM55 Rectal prolapse disorder (TM2)
SM56 Anal abscess disorder (TM2)
SM5Y Other specified anorectal disorders (TM2)
SM5Z Anorectal disorders (TM2), unspecified
SM70 Flank pain disorder (TM2)
SM71 Anorexia disorder (TM2)
SM72 Bowel inflammation disorder (TM2)
SM73 Infantile tenesmus disorder (TM2)
SM74 Hiccough disorder (TM2)
SM75 Dynamic intestinal obstruction disorder (TM2)
SM76 Severe vomiting and diarrhoea disorder (TM2)
SM7Y Other specified gastro-intestinal disorders (TM2)
SM7Z Gastro-intestinal disorders (TM2), unspecified
SN30 Gonorrhoea disorder (TM2)
SN31 Syphillis disorder (TM2)
SN3Y Other specified urinary and reproductive system disorders (TM2)
SN3Z Urinary and reproductive system disorders (TM2), unspecified
SN90 Patchy alopecia disorder (TM2)
SN91 Dandruff disorder (TM2)
SN92 Carbuncle disorder (TM2)
SN9Y Other specified skin, nail and hair disorders (TM2)
SN9Z Skin, nail and hair disorders (TM2), unspecified
SP40 Achillodynia disorder (TM2)
SP41 Sciatica disorder (TM2)
SP42 Lumbar spondylosis disorder (TM2)
SP43 Lumbo-sacroiliac disorder (TM2)
SP44 Torticollis disorder (TM2)
SP45 Cervical spondylosis disorder (TM2)
SP4Y Other specified bone, joint and muscle disorders (TM2)
SP4Z Bone, joint and muscle disorders (TM2), unspecified
SP90 Abscess disorder (TM2)
SP91 Generalised oedema disorder (TM2)
SP92 Oedema disorder (TM2)
SP93 Impaired immunity disorder (TM2)
SP94 Inflammation disorder (TM2)
SP95 Excessive yawning disorder (TM2)
SP96 Laziness disorder (TM2)
SP97 Severe fatigue disorder (TM2)
SP98 Syncope disorder (TM2)
SP99 Pruritus disorder (TM2)
SP9A General debility disorder (TM2)
SP9Y Other specified disorders affecting the whole body (TM2)
SP9Z Disorders affecting the whole body (TM2), unspecified
SQ40 Hypersomnia disorder (TM2)
SQ41 Lycanthropy disorder (TM2)
SQ4Y Other specified mental, emotional and behavioural disorders (TM2)
SQ4Z Mental, emotional and behavioural disorders (TM2), unspecified
SQ80 Inadequate diet disorders (TM2)
SQ8Y Other specified external factors disorders (TM2)
SQ8Z External factors disorders (TM2), unspecified
SR00 Marasmus disorder (TM2)
SR01 Bed wetting disorder (TM2)
SR02 Infantile dysentry disorder (TM2)
SR03 Infantile epilepsy disorder (TM2)
SR04 Ophthalmia neonatarum disorder (TM2)
SR05 Childhood malnutrition disorder (TM2)
SR06 Oral thrush in babies disorder (TM2)
SR0Y Other specified childhood disorders (TM2)
SR0Z Childhood disorders (TM2), unspecified
SR10 Vitiation of vāta pattern (TM2)
SR11 Accumulation of Vata pattern (TM2)
SR12 Aggravation of vata pattern (TM2)
SR13 Spreading of vata pattern (TM2)
SR14 Depletion of vata pattern (TM2)
SR15 Vitiation of pitta pattern (TM2)
SR16 Accumulation of pitta pattern (TM2)
SR17 Aggravation of pitta pattern (TM2)
SR18 Spreading of pitta pattern (TM2)
SR19 Depletion of pitta pattern (TM2)
SR1A Vitiation of kapha pattern (TM2)
SR1B Accumulation of kapha pattern (TM2)
SR1C Aggravation of kapha pattern (TM2)
SR1D Spreading of kapha pattern (TM2)
SR1E Depletion of kapha pattern (TM2)
SR1F Increase of Vaḷi pattern (TM2)
SR1G Increase of Aẕal pattern (TM2)
SR1H Increase of Aiyam pattern (TM2)
SR1J Decrease of Vaḷi pattern (TM2)
SR1K Decrease of Aẕal pattern (TM2)
SR1L Decrease of Aiyam pattern (TM2)
SR1M Predominance of Dam pattern (TM2)
SR1N Predominance of Ṣafrā’ pattern (TM2)
SR1P Predominance of Balgham pattern (TM2)
SR1Q Predominance of Sawdā’ pattern (TM2)
SR1R Blood thickening pattern (TM2)
SR1S Blood thinning pattern (TM2)
SR1T Blood deficiency pattern (TM2)
SR1U Blood hyperviscosity pattern (TM2)
SR1V Spoilage of humors pattern (TM2)
SR1W Burning of humors pattern (TM2)
SR1X Thickening of humors pattern (TM2)
SR20 Pattern of occlusion (TM2)
SR2Y Other specified functional elements and humoral derangement patterns (TM2)
SR2Z Functional elements and humoral derangement patterns (TM2), unspecified
SR40 Vitiation of "primary structural components of the body" pattern (TM2)
SR41 Aggravation of primary circulating nutrient fluid pattern (TM2)
SR42 Depletion of primary circulating nutrient fluid pattern (TM2)
SR43 Morbid increase of blood pattern (TM2)
SR44 Depletion of blood pattern (TM2)
SR45 Excessive increase of muscular tissues pattern (TM2)
SR46 Depletion of muscular tissues pattern (TM2)
SR47 Increase of adipose tissues pattern (TM2)
SR48 Depletion of adipose tissues pattern (TM2)
SR49 Increase of bone tissues pattern (TM2)
SR4A Depletion of bone tissues pattern (TM2)
SR4B Increase of bone marrow pattern (TM2)
SR4C Depletion of bone marrow pattern (TM2)
SR4D Increase of reproductive tissues and semen pattern (TM2)
SR4E Depletion of reproductive tissues and semen pattern (TM2)
SR4F Diminution of Ojas pattern (TM2)
SR4G Derangement of Ojas pattern (TM2)
SR4H Dislodgement of Ojas pattern (TM2)
SR4J Increased menstrual flow pattern (TM2)
SR4K Diminution of menstrual flow pattern (TM2)
SR4L Increased secretion of breast milk pattern (TM2)
SR4M Decreased secretion of breast milk pattern (TM2)
SR60 Increase of female reproductive tissue pattern (TM2)
SR61 Decrease of female reproductive tissue pattern (TM2)
SR62 Pattern resulting in abnormal number of organs and appendages (TM2)
SR63 Pattern of abnormal positioning of organs and appendages (TM2)
SR64 Pattern of abnormal relative position of organs (TM2)
SR65 Loss of continuity pattern (TM2)
SR66 Rīḥ pattern (TM2)
SR67 Bukhārāt pattern (TM2)
SR68 Compound pattern (TM2)
SR69 Pattern of quantity (TM2)
SR6Y Other specified physical constituent derangement patterns (TM2)
SR6Z Physical constituent derangement patterns (TM2), unspecified
SR80 Morbid increase of feces pattern (TM2)
SR81 Depletion of faeces pattern (TM2)
SR82 Excessive urine pattern (TM2)
SR83 Reduced urine pattern (TM2)
SR84 Hyperhidrosis pattern (TM2)
SR85 Anhidrosis pattern (TM2)
SR86 Faeces with undigested food residues pattern (TM2)
SR87 Urine of over heat pattern (TM2)
SR88 Urine colour of excessive cold pattern (TM2)
SR89 Urine colour of excessive depravement of Vaḷi, Aẕal and Aiyam pattern (TM2)
SR8A Urine like colour of raw-meat washings pattern (TM2)
SR8B Delayed passing of stool pattern (TM2)
SR8C Dry stool pattern (TM2)
SR8D Larger quantity of stool pattern (TM2)
SR8E Sharp smelling sweat pattern (TM2)
SR8F Sour smelling sweat pattern (TM2)
SR8G Sweat of thick consistency pattern (TM2)
SR8H Sweat of thin consistency pattern (TM2)
SR8J Lack of sweat pattern (TM2)
SR8K Excess of sputum pattern (TM2)
SR8L Lack of sputum pattern (TM2)
SR8M Moderate quantity of sputum during convalescence pattern (TM2)
SR8N Excess of sweat pattern due to decreased vitality (TM2)
SR8Y Other specified excretory products derangement patterns (TM2)
SR8Z Excretory products derangement patterns (TM2), unspecified
SS4Y Other specified power derangement and chronic accumulation patterns (TM2)
SS4Z Power derangement and chronic accumulation patterns (TM2), unspecified
ST00 Abnormal temperament pattern (TM2)
ST01 Simple morbid temperament pattern (TM2)
ST02 Simple abnormal temperament without substance pattern (TM2)
ST03 Abnormal hot temperament pattern (TM2)
ST04 Abnormal cold temperament pattern (TM2)
ST05 Abnormal moist temperament pattern (TM2)
ST06 Abnormal dry temperament pattern (TM2)
ST07 Abnormal temperament associated with substance pattern (TM2)
ST08 Abnormal hot temperament with substance pattern (TM2)
ST09 Abnormal cold temperament with substance pattern (TM2)
ST0A Abnormal moist temperament with substance pattern (TM2)
ST0B Abnormal dry temperament with substance pattern (TM2)
ST0C Compound morbid temperament pattern (TM2)
ST0D Simple compound abnormal temperament pattern (TM2)
ST0E Simple hot and moist abnormal temperament pattern (TM2)
ST0F Simple hot and dry abnormal temperament pattern (TM2)
ST0G Simple cold and moist abnormal temperament pattern (TM2)
ST0H Simple cold and dry abnormal temperament pattern (TM2)
ST0J Compound abnormal temperament associated with substance pattern (TM2)
ST0K Abnormal hot and moist temperament associated with substance pattern (TM2)
ST0L Abnormal hot and dry temperament associated with substance pattern (TM2)
ST0M Abnormal cold and moist temperament associated with substance pattern (TM2)
ST0N Abnormal cold and dry temperament associated with substance pattern (TM2)
ST0P Stable abnormal temperament pattern (TM2)
ST0Q Unstable abnormal temperament pattern (TM2)
ST0R Thickening of moisture pattern (TM2)
ST0S Presence of foreign moisture pattern (TM2)
ST0T Thinning of moistures pattern (TM2)
ST0U Infection of moistures pattern (TM2)
ST0V Change of temperament of psychic Rūḥ pattern (TM2)
ST0W Predominance of hotness pattern (TM2)
ST0X Predominance of coldness pattern (TM2)
ST10 Predominance of moistness pattern (TM2)
ST11 Predominance of dryness pattern (TM2)
ST1Y Other specified body constitution and temperament patterns (TM2)
ST1Z Body constitution and temperament patterns (TM2), unspecified
ST20 Injury pattern in the varmam or marmam (TM2)
ST2Y Other specified varmam and Marmam patterns (TM2)
ST2Z Varmam and Marmam patterns (TM2), unspecified
"""

input_file = "namastesample-2.csv"
output_file = "namaste_results-tm2.csv"

results = []

with open(input_file, "r", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    for i, row in enumerate(reader, start=1):
        code = row.get("Code", "")
        description = row.get("Description", "")
        
        # Step 2: Use a detailed prompt with the TM2 list as context
        prompt = f"""
        You are an expert at mapping traditional medicine terms to the ICD-11 Traditional Medicine 2 (TM2) classification system.
        
        Below is a list of all official TM2 codes and their corresponding terms.
        
        {tm2_list_string}
        
        Given the description: "{description}", find the single best matching term from the list above. 
        
        Your response must be in the format: "TERM (TM2)".
        
        If no suitable match is found, respond with "Not Found".
        """
        
        success = False
        while not success:
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                generated_text = response.text.strip() if response.text else "Not Found"
                
                results.append({"Code": code, "Description": description, "Response": generated_text})
                print(f" Row {i} done")
                success = True
            except Exception as e:
                print(f" Error on row {i}: {e}. Retrying in 60s...")
                time.sleep(60)

#  Save results to CSV
with open(output_file, "w", encoding="utf-8", newline="") as csvfile:
    fieldnames = ["Code", "Description", "Response"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print(f"\n Finished! Results saved to {output_file}")
